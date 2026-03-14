import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import SettingsForm from './SettingsForm.svelte';

describe('SettingsForm', () => {
	it('renders username and token inputs', () => {
		const { getByPlaceholderText } = render(SettingsForm);
		expect(getByPlaceholderText('octocat')).toBeTruthy();
		expect(getByPlaceholderText('ghp_...')).toBeTruthy();
	});

	it('shows validation errors', () => {
		const { getByText } = render(SettingsForm, {
			props: { usernameError: 'Invalid username', tokenError: 'Invalid token' }
		});
		expect(getByText('Invalid username')).toBeTruthy();
		expect(getByText('Invalid token')).toBeTruthy();
	});

	it('disables save when not dirty', () => {
		const { getByText } = render(SettingsForm, {
			props: { isDirty: false, isValid: true }
		});
		const btn = getByText('Save Settings');
		expect((btn as HTMLButtonElement).disabled).toBe(true);
	});

	it('enables save when dirty and valid', () => {
		const { getByText } = render(SettingsForm, {
			props: { isDirty: true, isValid: true }
		});
		const btn = getByText('Save Settings');
		expect((btn as HTMLButtonElement).disabled).toBe(false);
	});
});
