import { StarsDbService, SettingsDbService } from '../db';
import { GitHubService } from '../github';
import { CacheService } from './cache';

interface ServiceRegistry {
	starsDb: StarsDbService;
	settingsDb: SettingsDbService;
	github: GitHubService;
	cache: CacheService;
}

export class ServiceManager {
	private static instance: ServiceManager;
	private services: ServiceRegistry;

	private constructor() {
		this.services = {
			starsDb: new StarsDbService(),
			settingsDb: new SettingsDbService(),
			github: new GitHubService(),
			cache: new CacheService()
		};
	}

	static getInstance(): ServiceManager {
		if (!ServiceManager.instance) {
			ServiceManager.instance = new ServiceManager();
		}
		return ServiceManager.instance;
	}

	getService<T extends keyof ServiceRegistry>(name: T): ServiceRegistry[T] {
		return this.services[name];
	}

	// Allow setting GitHub token through the registry
	setGitHubToken(token: string): void {
		this.services.github.setToken(token);
	}

	// Allow re-initializing services if needed (useful for testing)
	reset(): void {
		this.services = {
			starsDb: new StarsDbService(),
			settingsDb: new SettingsDbService(),
			github: new GitHubService(),
			cache: new CacheService()
		};
	}
}

// Export services for direct usage if needed
export { CacheService } from './cache';

// Export type for TypeScript usage
export type { ServiceRegistry };

// Export convenience getter
export const getServiceManager = () => ServiceManager.getInstance();
