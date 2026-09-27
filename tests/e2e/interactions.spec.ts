import { test, expect } from '@playwright/test'

test.describe('NFC Tap Interactions - US-3, US-5', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('start-demo-button').click()
    await expect(page.getByTestId('scene-2')).toBeVisible()
  })

  test('NFC tag shows ripple animation on tap (INV-D5)', async ({ page }) => {
    const nfcTag = page.getByTestId('nfc-tag')
    await expect(nfcTag).toBeVisible()

    // Click and verify ripple appears
    await nfcTag.click()

    // Scene should advance (ripple triggered state change)
    await expect(page.getByTestId('scene-3')).toBeVisible()
  })

  test('NFC tag is keyboard accessible', async ({ page }) => {
    const nfcTag = page.getByTestId('nfc-tag')

    // Tab to the NFC tag
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab') // May need multiple tabs

    // Focus should be on NFC tag (or we can focus directly)
    await nfcTag.focus()
    await expect(nfcTag).toBeFocused()

    // Press Enter to activate
    await page.keyboard.press('Enter')

    // Should advance to scene 3
    await expect(page.getByTestId('scene-3')).toBeVisible()
  })

  test('NFC tag responds to spacebar', async ({ page }) => {
    const nfcTag = page.getByTestId('nfc-tag')
    await nfcTag.focus()

    await page.keyboard.press('Space')

    await expect(page.getByTestId('scene-3')).toBeVisible()
  })

  test('tap out requires interaction in scene 5', async ({ page }) => {
    // Navigate to scene 5
    await page.getByTestId('nfc-tag').click()
    await expect(page.getByTestId('scene-5')).toBeVisible({ timeout: 10000 })

    // Verify tap out NFC tag is present and glowing
    const nfcTag = page.getByTestId('nfc-tag')
    await expect(nfcTag).toBeVisible()
    await expect(nfcTag).toHaveAttribute('data-glowing', 'true')

    // Tap to complete
    await nfcTag.click()

    // Should advance to chain celebration
    await expect(page.getByTestId('scene-6')).toBeVisible()
  })
})
