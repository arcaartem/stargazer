import type { AppSettings } from '$lib/types';
import { loadSettings, saveSettings, clearSettings } from '$lib/services/settings';
import { clearIndex } from '$lib/services/search';
import { validateGithubUsername, validateGithubToken } from '$lib/utils/validation';

class SettingsStore {
	username = $state('');
	token = $state('');
	lastSyncedAt = $state<string | null>(null);
	repoCount = $state(0);
	readmeCount = $state(0);
	isDirty = $state(false);
	isSaving = $state(false);
	saveError = $state<string | null>(null);

	private savedUsername = '';
	private savedToken = '';

	get usernameError(): string | null {
		if (!this.username) return null;
		return validateGithubUsername(this.username);
	}

	get tokenError(): string | null {
		if (!this.token) return null;
		return validateGithubToken(this.token);
	}

	get isValid(): boolean {
		return (
			!this.usernameError && !this.tokenError && this.username.length > 0 && this.token.length > 0
		);
	}

	async load() {
		const settings = await loadSettings();
		this.username = settings.githubUsername;
		this.token = settings.githubToken;
		this.lastSyncedAt = settings.lastSyncedAt;
		this.repoCount = settings.repoCount;
		this.readmeCount = settings.readmeCount;
		this.savedUsername = settings.githubUsername;
		this.savedToken = settings.githubToken;
		this.isDirty = false;
	}

	setUsername(value: string) {
		this.username = value;
		this.isDirty = value !== this.savedUsername || this.token !== this.savedToken;
	}

	setToken(value: string) {
		this.token = value;
		this.isDirty = this.username !== this.savedUsername || value !== this.savedToken;
	}

	async save(): Promise<boolean> {
		if (!this.isValid) return false;

		this.isSaving = true;
		this.saveError = null;

		try {
			const settings: AppSettings = {
				githubUsername: this.username,
				githubToken: this.token,
				lastSyncedAt: this.lastSyncedAt,
				repoCount: this.repoCount,
				readmeCount: this.readmeCount
			};
			await saveSettings(settings);
			this.savedUsername = this.username;
			this.savedToken = this.token;
			this.isDirty = false;
			return true;
		} catch (err) {
			this.saveError = err instanceof Error ? err.message : 'Failed to save settings';
			return false;
		} finally {
			this.isSaving = false;
		}
	}

	async clearData() {
		await clearSettings();
		clearIndex();
		this.username = '';
		this.token = '';
		this.lastSyncedAt = null;
		this.repoCount = 0;
		this.readmeCount = 0;
		this.savedUsername = '';
		this.savedToken = '';
		this.isDirty = false;
	}
}

export const settingsStore = new SettingsStore();
