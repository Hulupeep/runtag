import { test, expect } from '@playwright/test'

test.describe('Demo Flow - US-1 to US-8', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('completes full demo journey from scene 1 to scene 8', async ({ page }) => {
    // Scene 1: Hook (Landing Page)
    await expect(page.getByTestId('scene-1')).toBeVisible()
    // Headline is now split across lines in the landing page
    await expect(page.locator('.hero-headline')).toBeVisible()
    await expect(page.locator('.hero-headline')).toContainText('fat')

    // Click start button
    await page.getByTestId('start-demo-button').click()

    // Scene 2: Setup
    await expect(page.getByTestId('scene-2')).toBeVisible()
    await expect(page.getByText("It's 7am. You're at the edge of the woods.")).toBeVisible()
    await expect(page.getByTestId('iphone-mockup')).toBeVisible()
    await expect(page.getByTestId('tree-illustration')).toBeVisible()

    // Verify initial chain count is 4
    const indicator = page.getByTestId('scene-indicator')
    await expect(indicator).toHaveAttribute('data-chain-count', '4')

    // Tap the NFC tag to start run
    await page.getByTestId('nfc-tag').click()

    // Scene 3: Tap In (auto-advances)
    await expect(page.getByTestId('scene-3')).toBeVisible()
    await expect(page.getByText('TAGGED')).toBeVisible()

    // Scene 4: Run (wait for animation)
    await expect(page.getByTestId('scene-4')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('No pace to check.')).toBeVisible()
    await expect(page.getByTestId('runner-animation')).toBeVisible()

    // Scene 5: Tap Out (after run animation completes)
    await expect(page.getByTestId('scene-5')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Run complete. Tap out.')).toBeVisible()

    // Tap out
    await page.getByTestId('nfc-tag').click()

    // Scene 6: Chain Grows
    await expect(page.getByTestId('scene-6')).toBeVisible()
    await expect(page.getByText('Day 5. Chain unbroken.')).toBeVisible()
    await expect(page.getByTestId('big-checkmark')).toBeVisible()

    // Verify chain incremented to 5
    await expect(indicator).toHaveAttribute('data-chain-count', '5')

    // Scene 7: Discovery
    await expect(page.getByTestId('scene-7')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Discover routes others have created.')).toBeVisible()
    await expect(page.getByTestId('map-view')).toBeVisible()

    // Continue to final scene
    await page.getByRole('button', { name: 'See How It Works' }).click()

    // Scene 8: CTA
    await expect(page.getByTestId('scene-8')).toBeVisible()
    await expect(page.getByText('Stop optimizing. Start moving.')).toBeVisible()
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible()
    await expect(page.getByTestId('restart-button')).toBeVisible()
  })

  test('restart button returns to scene 1', async ({ page }) => {
    // Quick path to scene 8
    await page.getByTestId('start-demo-button').click()
    await page.getByTestId('nfc-tag').click()
    await expect(page.getByTestId('scene-5')).toBeVisible({ timeout: 10000 })
    await page.getByTestId('nfc-tag').click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'See How It Works' }).click()

    // Now at scene 8
    await expect(page.getByTestId('scene-8')).toBeVisible()

    // Click restart
    await page.getByTestId('restart-button').click()

    // Should be back at scene 1
    await expect(page.getByTestId('scene-1')).toBeVisible()
    const indicator = page.getByTestId('scene-indicator')
    await expect(indicator).toHaveAttribute('data-current-scene', '1')
    await expect(indicator).toHaveAttribute('data-chain-count', '4')
  })
})
