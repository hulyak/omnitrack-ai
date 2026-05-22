'use client';

/**
 * Tech Stack Component
 * Showcases the AWS and AI technologies powering OmniTrack
 */

const technologies = [
  {
    category: 'AI & ML',
    items: [
      { name: 'Amazon Bedrock', description: 'Claude 3 for reasoning' },
      { name: 'SageMaker', description: 'ML model training' },
      { name: 'Step Functions', description: 'Agent orchestration' },
    ],
  },
  {
    category: 'Compute & Storage',
    items: [
      { name: 'Lambda', description: 'Serverless functions' },
      { name: 'DynamoDB', description: 'NoSQL database' },
      { name: 'OpenSearch', description: 'Search & analytics' },
    ],
  },
  {
    category: 'Real-time & IoT',
    items: [
      { name: 'IoT Core', description: 'Device connectivity' },
      { name: 'API Gateway', description: 'WebSocket APIs' },
      { name: 'ElastiCache', description: 'Redis caching' },
    ],
  },
  {
    category: 'Frontend',
    items: [
      { name: 'Next.js 15', description: 'React framework' },
      { name: 'TailwindCSS', description: 'Styling' },
      { name: 'TypeScript', description: 'Type safety' },
    ],
  },
];

export function TechStack() {
  return (
    <div className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Built on AWS & Modern AI
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Enterprise-grade infrastructure with cutting-edge AI capabilities
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {technologies.map((tech, i) => (
            <div key={i} className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b-2 border-blue-500 pb-2">
                {tech.category}
              </h3>
              <div className="space-y-3">
                {tech.items.map((item, j) => (
                  <div key={j} className="group">
                    <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 p-8 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl">
          {[
            { label: 'Uptime SLA', value: '99.9%' },
            { label: 'Response Time', value: '<100ms' },
            { label: 'Scalability', value: 'Auto' },
            { label: 'Security', value: 'SOC 2' },
          ].map((metric, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-gray-600">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
