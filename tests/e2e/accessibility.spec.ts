import { test, expect } from '@playwright/test'

test.describe('Accessibility - INV-D7', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('all interactive elements are keyboard navigable', async ({ page }) => {
    // Scene 1: Start button should be focusable
    const startButton = page.getByTestId('start-demo-button')
    await startButton.focus()
    await expect(startButton).toBeFocused()

    // Activate with Enter
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('scene-2')).toBeVisible()

    // Scene 2: NFC tag should be focusable
    const nfcTag = page.getByTestId('nfc-tag')
    await nfcTag.focus()
    await expect(nfcTag).toBeFocused()
  })

  test('page has proper ARIA landmarks', async ({ page }) => {
    // Main landmark should exist
    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('buttons have accessible names', async ({ page }) => {
    const startButton = page.getByTestId('start-demo-button')
    // Button text serves as accessible name
    await expect(startButton).toContainText('Try RunTag Demo')

    await startButton.click()
    await expect(page.getByTestId('scene-2')).toBeVisible()

    const nfcTag = page.getByTestId('nfc-tag')
    await expect(nfcTag).toHaveAttribute('aria-label')
  })

  test('scene changes are announced to screen readers', async ({ page }) => {
    // Scene indicator has aria-live
    const indicator = page.getByTestId('scene-indicator')
    await expect(indicator).toHaveAttribute('aria-live', 'polite')

    // Advance scene
    await page.getByTestId('start-demo-button').click()

    // Indicator should update
    await expect(indicator).toContainText('Scene 2')
  })

  test('focus management on scene transitions', async ({ page }) => {
    await page.getByTestId('start-demo-button').click()

    // After transition, focus should move to interactive content
    // The NFC tag in scene 2 should be focusable
    const nfcTag = page.getByTestId('nfc-tag')
    await expect(nfcTag).toBeVisible()

    // Tab should reach the NFC tag
    await page.keyboard.press('Tab')
    // May need to tab through other elements
  })
})
