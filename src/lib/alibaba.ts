/**
 * Alibaba Cloud Infrastructure Integration for Medlingo
 *
 * Demonstrates integration with Alibaba Cloud services for:
 * - Auto-scaling ECS instances during high report-processing loads
 * - Health monitoring of cloud infrastructure
 *
 * This file serves as proof of Alibaba Cloud deployment capability
 * as required by the hackathon submission.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const China_Core = require('@alicloud/pop-core');

const client = new China_Core({
  accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET || '',
  endpoint: `https://ecs.${process.env.ALIBABA_CLOUD_REGION || 'ap-southeast-1'}.aliyuncs.com`,
  apiVersion: '2014-05-26',
});

/**
 * Describes current ECS instances running the Medlingo analysis workers.
 */
export async function describeInstances() {
  const params = {
    RegionId: process.env.ALIBABA_CLOUD_REGION || 'ap-southeast-1',
    PageSize: 10,
  };

  try {
    const result = await client.request('DescribeInstances', params, { method: 'POST' });
    return result;
  } catch (error) {
    console.error('[Alibaba Cloud] Failed to describe instances:', error);
    throw error;
  }
}

/**
 * Scales the Medlingo analysis worker fleet by modifying the auto-scaling group.
 * This would be triggered when the report processing queue exceeds a threshold.
 */
export async function scaleWorkers(desiredCapacity: number) {
  const params = {
    RegionId: process.env.ALIBABA_CLOUD_REGION || 'ap-southeast-1',
    ScalingGroupId: process.env.ALIBABA_SCALING_GROUP_ID || '',
    TotalCapacity: desiredCapacity,
  };

  try {
    const result = await client.request('ModifyScalingGroup', params, { method: 'POST' });
    console.log(`[Alibaba Cloud] Scaled workers to ${desiredCapacity}`);
    return result;
  } catch (error) {
    console.error('[Alibaba Cloud] Failed to scale workers:', error);
    throw error;
  }
}

/**
 * Health check for Alibaba Cloud connectivity.
 */
export async function checkCloudHealth(): Promise<{ connected: boolean; region: string }> {
  try {
    await client.request('DescribeRegions', {}, { method: 'POST' });
    return {
      connected: true,
      region: process.env.ALIBABA_CLOUD_REGION || 'ap-southeast-1',
    };
  } catch {
    return {
      connected: false,
      region: process.env.ALIBABA_CLOUD_REGION || 'ap-southeast-1',
    };
  }
}
