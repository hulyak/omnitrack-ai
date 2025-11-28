/**
 * Marketplace Service for scenario publishing, rating, and forking
 */

import { ScenarioRepository } from '../repositories/scenario-repository';
import { Scenario, MarketplaceMetadata } from '../models/types';
import { randomUUID } from 'crypto';

export interface PublishScenarioRequest {
  scenarioId: string;
  title: string;
  description: string;
  tags: string[];
  industry: string;
  geography: string;
}

export interface RateScenarioRequest {
  scenarioId: string;
  userId: string;
  rating: number;
  review?: string;
}

export interface ForkScenarioRequest {
  scenarioId: string;
  userId: string;
  modifications?: Partial<Scenario>;
}

export interface SearchFilters {
  industry?: string;
  disruptionType?: string;
  geography?: string;
  minRating?: number;
  tags?: string[];
}

export class MarketplaceService {
  private scenarioRepository: ScenarioRepository;

  constructor() {
    this.scenarioRepository = new ScenarioRepository();
  }

  /**
   * Publish a scenario to the marketplace
   */
  async publishScenario(request: PublishScenarioRequest): Promise<Scenario> {
    // Validate scenario exists
    const scenario = await this.scenarioRepository.getScenarioById(request.scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${request.scenarioId} not found`);
    }

    // Validate marketplace metadata completeness
    this.validateMarketplaceMetadata(request);

    // Update scenario with marketplace metadata
    const marketplaceMetadata: MarketplaceMetadata = {
      title: request.title,
      description: request.description,
      author: scenario.createdBy,
      rating: 0,
      usageCount: 0,
      tags: request.tags,
      industry: request.industry,
      geography: request.geography
    };

    const updatedScenario = await this.scenarioRepository.updateScenario(
      request.scenarioId,
      scenario.createdBy,
      {
        isPublic: true,
        marketplaceMetadata
      },
      scenario.version
    );

    return updatedScenario;
  }

  /**
   * Rate a marketplace scenario
   */
  async rateScenario(request: RateScenarioRequest): Promise<void> {
    // Validate rating range
    if (request.rating < 1 || request.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const scenario = await this.scenarioRepository.getScenarioById(request.scenarioId);
    if (!scenario || !scenario.isPublic) {
      throw new Error(`Marketplace scenario ${request.scenarioId} not found`);
    }

    // Store individual rating
    await this.storeRating(request);

    // Update aggregate rating
    await this.updateAggregateRating(request.scenarioId);
  }

  /**
   * Fork a marketplace scenario
   */
  async forkScenario(request: ForkScenarioRequest): Promise<Scenario> {
    const originalScenario = await this.scenarioRepository.getScenarioById(request.scenarioId);
    if (!originalScenario || !originalScenario.isPublic) {
      throw new Error(`Marketplace scenario ${request.scenarioId} not found`);
    }

    // Create new scenario with attribution
    const forkedScenario = await this.scenarioRepository.createScenario({
      type: request.modifications?.type || originalScenario.type,
      parameters: request.modifications?.parameters || originalScenario.parameters,
      createdBy: request.userId,
      isPublic: false,
      marketplaceMetadata: {
        ...originalScenario.marketplaceMetadata!,
        originalAuthor: originalScenario.marketplaceMetadata?.author || originalScenario.createdBy,
        author: request.userId,
        rating: 0,
        usageCount: 0
      }
    });

    // Increment usage count on original
    await this.incrementUsageCount(request.scenarioId);

    return forkedScenario;
  }

  /**
   * Search marketplace scenarios with filters
   */
  async searchScenarios(filters: SearchFilters): Promise<Scenario[]> {
    // Get all public scenarios
    const result = await this.scenarioRepository.listScenarios();
    const publicScenarios = result.items.filter(s => s.isPublic && s.marketplaceMetadata);

    // Apply filters
    let filteredScenarios = publicScenarios;

    if (filters.industry) {
      filteredScenarios = filteredScenarios.filter(
        s => s.marketplaceMetadata?.industry === filters.industry
      );
    }

    if (filters.disruptionType) {
      filteredScenarios = filteredScenarios.filter(
        s => s.type === filters.disruptionType
      );
    }

    if (filters.geography) {
      filteredScenarios = filteredScenarios.filter(
        s => s.marketplaceMetadata?.geography === filters.geography
      );
    }

    if (filters.minRating !== undefined) {
      filteredScenarios = filteredScenarios.filter(
        s => (s.marketplaceMetadata?.rating || 0) >= filters.minRating!
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredScenarios = filteredScenarios.filter(s =>
        filters.tags!.some(tag => s.marketplaceMetadata?.tags.includes(tag))
      );
    }

    return filteredScenarios;
  }

  /**
   * Get marketplace scenario by ID
   */
  async getMarketplaceScenario(scenarioId: string): Promise<Scenario> {
    const scenario = await this.scenarioRepository.getScenarioById(scenarioId);
    if (!scenario || !scenario.isPublic) {
      throw new Error(`Marketplace scenario ${scenarioId} not found`);
    }
    return scenario;
  }

  /**
   * List all marketplace scenarios
   */
  async listMarketplaceScenarios(): Promise<Scenario[]> {
    const result = await this.scenarioRepository.listScenarios();
    return result.items.filter(s => s.isPublic && s.marketplaceMetadata);
  }

  /**
   * Validate marketplace metadata completeness
   */
  private validateMarketplaceMetadata(request: PublishScenarioRequest): void {
    if (!request.title || request.title.trim().length === 0) {
      throw new Error('Title is required');
    }
    if (!request.description || request.description.trim().length === 0) {
      throw new Error('Description is required');
    }
    if (!request.industry || request.industry.trim().length === 0) {
      throw new Error('Industry is required');
    }
    if (!request.geography || request.geography.trim().length === 0) {
      throw new Error('Geography is required');
    }
    if (!request.tags || request.tags.length === 0) {
      throw new Error('At least one tag is required');
    }
  }

  /**
   * Store individual rating
   */
  private async storeRating(request: RateScenarioRequest): Promise<void> {
    const timestamp = new Date().toISOString();
    const item = {
      PK: `MARKETPLACE#${request.scenarioId}`,
      SK: `RATING#${request.userId}`,
      score: request.rating,
      review: request.review || '',
      timestamp
    };

    await this.scenarioRepository['putItem'](item);
  }

  /**
   * Update aggregate rating
   */
  private async updateAggregateRating(scenarioId: string): Promise<void> {
    // Query all ratings for this scenario
    const result = await this.scenarioRepository['query'](
      `MARKETPLACE#${scenarioId}`,
      { operator: 'begins_with', value: 'RATING#' }
    );

    if (result.items.length === 0) {
      return;
    }

    // Calculate average rating
    const totalRating = result.items.reduce((sum, item) => sum + (item.score || 0), 0);
    const averageRating = totalRating / result.items.length;

    // Update scenario with new aggregate rating
    const scenario = await this.scenarioRepository.getScenarioById(scenarioId);
    if (scenario && scenario.marketplaceMetadata) {
      await this.scenarioRepository.updateScenario(
        scenarioId,
        scenario.createdBy,
        {
          marketplaceMetadata: {
            ...scenario.marketplaceMetadata,
            rating: Math.round(averageRating * 10) / 10 // Round to 1 decimal
          }
        },
        scenario.version
      );
    }
  }

  /**
   * Increment usage count for a scenario
   */
  private async incrementUsageCount(scenarioId: string): Promise<void> {
    const scenario = await this.scenarioRepository.getScenarioById(scenarioId);
    if (scenario && scenario.marketplaceMetadata) {
      await this.scenarioRepository.updateScenario(
        scenarioId,
        scenario.createdBy,
        {
          marketplaceMetadata: {
            ...scenario.marketplaceMetadata,
            usageCount: scenario.marketplaceMetadata.usageCount + 1
          }
        },
        scenario.version
      );
    }
  }
}
