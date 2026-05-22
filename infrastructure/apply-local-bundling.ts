#!/usr/bin/env ts-node

/**
 * Script to update infrastructure-stack.ts to use local bundling
 * Run with: npx ts-node apply-local-bundling.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const stackPath = path.join(__dirname, 'lib', 'infrastructure-stack.ts');
const backupPath = path.join(__dirname, 'lib', 'infrastructure-stack.ts.backup');

console.log('🔧 Applying local bundling configuration...\n');

// Read the file
let content = fs.readFileSync(stackPath, 'utf-8');

// Create backup
fs.writeFileSync(backupPath, content);
console.log('✅ Backup created:', backupPath);

// Add import at the top (after other imports)
const importStatement = `import { localBundlingConfig, vpcBundlingConfig, copilotBundlingConfig, iotBundlingConfig } from './lambda-bundling-config';\n`;

if (!content.includes('lambda-bundling-config')) {
  // Find the last import statement
  const lastImportIndex = content.lastIndexOf("import * as");
  const nextLineIndex = content.indexOf('\n', lastImportIndex);
  
  content = content.slice(0, nextLineIndex + 1) + importStatement + content.slice(nextLineIndex + 1);
  console.log('✅ Added import statement');
}

// Replace bundling configurations
let replacements = 0;

// Pattern 1: Standard bundling (no VPC)
const standardPattern = /bundling: \{\s*minify: true,\s*sourceMap: true,\s*externalModules: \['aws-sdk'\],\s*\}/g;
content = content.replace(standardPattern, () => {
  replacements++;
  return 'bundling: localBundlingConfig';
});

// Pattern 2: VPC bundling
const vpcPattern = /bundling: \{\s*minify: true,\s*sourceMap: true,\s*externalModules: \['aws-sdk'\],\s*\}/g;
// For functions with VPC configuration, we need a more sophisticated approach
const lines = content.split('\n');
let inVpcFunction = false;
let inBundling = false;
let bundlingStartLine = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check if we're in a VPC function
  if (line.includes('vpc: this.vpc') || line.includes('vpcSubnets:')) {
    inVpcFunction = true;
  }
  
  // Check if we're starting a bundling block
  if (line.includes('bundling: {')) {
    inBundling = true;
    bundlingStartLine = i;
  }
  
  // Check if we're ending a bundling block
  if (inBundling && line.includes('},')) {
    // Replace the bundling block
    if (inVpcFunction) {
      lines[bundlingStartLine] = '      bundling: vpcBundlingConfig,';
      // Remove lines between start and end
      for (let j = bundlingStartLine + 1; j <= i; j++) {
        lines[j] = '';
      }
      replacements++;
    } else {
      lines[bundlingStartLine] = '      bundling: localBundlingConfig,';
      // Remove lines between start and end
      for (let j = bundlingStartLine + 1; j <= i; j++) {
        lines[j] = '';
      }
      replacements++;
    }
    
    inBundling = false;
    inVpcFunction = false;
    bundlingStartLine = -1;
  }
  
  // Reset VPC flag if we hit a new function
  if (line.includes('new lambdaNodejs.NodejsFunction')) {
    inVpcFunction = false;
  }
}

content = lines.filter(line => line !== '').join('\n');

// Write the updated file
fs.writeFileSync(stackPath, content);

console.log(`✅ Updated ${replacements} bundling configurations`);
console.log('\n🎉 Local bundling configuration applied!');
console.log('\nNext steps:');
console.log('1. Review changes: git diff infrastructure/lib/infrastructure-stack.ts');
console.log('2. Test synthesis: cd infrastructure && cdk synth');
console.log('3. Deploy: cd infrastructure && cdk deploy --all');
console.log('\nTo revert: cp infrastructure/lib/infrastructure-stack.ts.backup infrastructure/lib/infrastructure-stack.ts');
