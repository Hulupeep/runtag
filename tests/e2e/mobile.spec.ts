import { test, expect, devices } from '@playwright/test'

// Configure mobile viewport at file level
test.use({ ...devices['iPhone 13'] })

test.describe('Mobile Experience - US-10, INV-D6', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders correctly on mobile viewport', async ({ page }) => {
    await expect(page.getByTestId('scene-1')).toBeVisible()
    // Headline is now split across lines in the landing page
    const headline = page.locator('.hero-headline')
    await expect(headline).toBeVisible()
    await expect(headline).toContainText('fat')
  })

  test('split view stacks vertically on mobile', async ({ page }) => {
    await page.getByTestId('start-demo-button').click()
    await expect(page.getByTestId('scene-2')).toBeVisible()

    // Get the split view container
    const splitView = page.locator('.split-view')
    await expect(splitView).toBeVisible()

    // On mobile, flex-direction should be column (stacked)
    // The split-left and split-right should stack
    const splitLeft = page.locator('.split-left')
    const splitRight = page.locator('.split-right')

    await expect(splitLeft).toBeVisible()
    await expect(splitRight).toBeVisible()

    // Check that they stack vertically by comparing positions
    const leftBox = await splitLeft.boundingBox()
    const rightBox = await splitRight.boundingBox()

    if (leftBox && rightBox) {
      // On mobile (stacked), the right element should be below the left
      expect(rightBox.y).toBeGreaterThanOrEqual(leftBox.y + leftBox.height - 50) // Allow some overlap due to gap
    }
  })

  test('tap targets are at least 48px (INV-D6)', async ({ page }) => {
    // Check start button
    const startButton = page.getByTestId('start-demo-button')
    const buttonBox = await startButton.boundingBox()

    if (buttonBox) {
      expect(buttonBox.height).toBeGreaterThanOrEqual(48)
    }

    await startButton.click()
    await expect(page.getByTestId('scene-2')).toBeVisible()

    // Check NFC tag
    const nfcTag = page.getByTestId('nfc-tag')
    const tagBox = await nfcTag.boundingBox()

    if (tagBox) {
      expect(tagBox.width).toBeGreaterThanOrEqual(48)
      expect(tagBox.height).toBeGreaterThanOrEqual(48)
    }
  })

  test('content does not overflow on mobile', async ({ page }) => {
    // Check each scene doesn't have horizontal overflow
    await expect(page.getByTestId('scene-1')).toBeVisible()

    // Get viewport width
    const viewportSize = page.viewportSize()
    if (!viewportSize) return

    // Check that main container width matches viewport
    const main = page.locator('main')
    const mainBox = await main.boundingBox()

    if (mainBox) {
      expect(mainBox.width).toBeLessThanOrEqual(viewportSize.width)
    }
  })

  test('full demo completes on mobile', async ({ page }) => {
    // Scene 1
    await page.getByTestId('start-demo-button').tap()

    // Scene 2 - tap NFC
    await expect(page.getByTestId('scene-2')).toBeVisible()
    await page.getByTestId('nfc-tag').tap()

    // Scene 3-4 auto-advance
    await expect(page.getByTestId('scene-5')).toBeVisible({ timeout: 10000 })

    // Scene 5 - tap out
    await page.getByTestId('nfc-tag').tap()

    // Scene 6
    await expect(page.getByTestId('scene-6')).toBeVisible()
    await page.getByRole('button', { name: 'Continue' }).tap()

    // Scene 7
    await expect(page.getByTestId('scene-7')).toBeVisible()
    await page.getByRole('button', { name: 'See How It Works' }).tap()

    // Scene 8
    await expect(page.getByTestId('scene-8')).toBeVisible()
    await expect(page.getByText('Stop optimizing. Start moving.')).toBeVisible()
  })
})
