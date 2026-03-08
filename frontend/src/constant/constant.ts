/**
 * Backward compatibility - Re-exports from new structure
 * @deprecated Use imports from core/config/environment instead
 */

import { ENVIRONMENT_CONFIGS, BuildEnvironment, EnvironmentConfig } from '../core/config/environment';

const constants = {
  CONFIGS: ENVIRONMENT_CONFIGS as Record<string, EnvironmentConfig>
};

export default constants;
