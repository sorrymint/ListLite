import { expect, test } from '@playwright/test';

test('reset form allows same-origin submission without exposing the token in the referrer', async ({
	page
}) => {
	const response = await page.goto(
		'http://localhost:4173/auth/reset-password?token_hash=test-token'
	);
	await page.locator('input[name="tokenHash"]').evaluate((input: HTMLInputElement) => {
		input.value = '';
	});
	await page.getByRole('button', { name: 'Confirm reset' }).click();
	await expect(page.getByRole('alert')).toHaveText(
		'This reset link is invalid. Request a new one.'
	);
	expect(response?.headers()['referrer-policy']).toBe('strict-origin');
});

test('reset form rejects cross-origin submissions', async ({ request }) => {
	const response = await request.post('http://localhost:4173/auth/reset-password?/verify', {
		headers: { origin: 'https://other.example' },
		form: { tokenHash: '' }
	});
	expect(response.status()).toBe(403);
});
