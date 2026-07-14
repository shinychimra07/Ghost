import {AdapterConstructor} from "./types";
import type {ConfigInstance} from '../../../shared/config/loader';

/**
* Resolve an adapter export to a constructor function, handling both CommonJS and ES module formats.
*/
export function resolveAdapterExport(moduleExport: unknown): AdapterConstructor | null {
    if (!moduleExport) {
        return null;
    }

    if (typeof moduleExport === "function") {
        return moduleExport as AdapterConstructor;
    }

    if (typeof moduleExport === "object" && "default" in moduleExport && typeof moduleExport.default === "function") {
        return moduleExport.default as AdapterConstructor;
    }

    return null;
}

/**
* Normalize adapter config by ensuring that feature-specific adapter configs
* are populated from top-level config if not explicitly provided.
*/
export function normalizeAdapterConfig(config: ConfigInstance) {
    const adapterConfig = config.get('adapters');

    // if no adapter config provided for storage, pull from the top-level storage config
    if (!adapterConfig.storage) {
        adapterConfig.storage = config.get('storage');
    }

    // if no adapter config provided for scheduling, pull from the top-level scheduling config
    if (!adapterConfig.scheduling) {
        const schedulingConfig = config.get('scheduling');
        const activeSchedulingAdapter = schedulingConfig?.active;

        if (activeSchedulingAdapter) {
            adapterConfig.scheduling = {
                active: activeSchedulingAdapter,
                [activeSchedulingAdapter]: {
                    schedulerUrl: schedulingConfig?.schedulerUrl,
                }
            }
        }
    }

    // FileStore needs Ghost's resolved content path, which isn't
    // representable as a static value in defaults.json.
    if (adapterConfig.redirects?.FileStore) {
        adapterConfig.redirects.FileStore.basePath ||= config.getContentPath('data');
    }

    return adapterConfig;
}

/**
* Resolve adapter options from the config, handling both top-level and nested feature-specific options.
*/
export function resolveAdapterOptions(name: string, config: any) {
    const [type, feature] = name.split(":");
    const settings = config[type]

    let adapterClassName: string;
    let adapterConfig: object;

    const featureAdapter = feature ? settings?.[feature] : undefined;
    if (featureAdapter && settings?.[featureAdapter]) {
        // CASE: load resource-specific adapter when there is an adapter feature
        //       name (String) specified as well as custom feature config
        adapterClassName = featureAdapter;
        adapterConfig = settings[featureAdapter];
    } else if (featureAdapter?.adapter) {
        // CASE: load resource-specific adapter when there is an adapter feature
        //       name (Object) specified as well as custom feature config
        adapterClassName = featureAdapter.adapter;
        const commonConfig = {...settings[adapterClassName]};
        const featureConfig = {...featureAdapter};
        delete featureConfig.adapter;
        adapterConfig = {...commonConfig, ...featureConfig};
    } else {
        adapterClassName = settings?.active;
        adapterConfig = settings?.[adapterClassName];
    }

    return {adapterClassName, adapterConfig};
}
