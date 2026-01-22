# RunTag Interactive Demo Website
## Claude Code Build Prompt

**Project**: RunTag - Anti-metric running accountability app
**Deliverable**: Interactive demo website that tells the story of using RunTag
**Tech Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
**Testing**: Playwright E2E tests for all user journeys

---

## 1. Product Context

### What is RunTag?
RunTag is the anti-fitness-tracker. No pace. No distance. No calories. Just one question: **Did you go?**

Users plant NFC tags at their running locations. Tap in when you start. Tap out when you finish. Build a streak. Don't break the chain.

### Core Philosophy
> "Your watch is making you fat. The only metric that matters is showing up."

### This Demo's Purpose
Convert visitors by letting them **experience** RunTag before downloading. The demo tells a story - the user becomes a runner going through a typical RunTag day.

---

## 2. Demo Experience Flow

The demo is a **narrative experience** in a single scrolling/stepping page. User progresses through scenes by interacting.

### Scene Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ SCENE 1: HOOK                                                   │
│ "Your watch is making you fat."                                 │
│ Headline + stats about unused fitness trackers                  │
│ [Try RunTag Demo →]                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ SCENE 2: THE SETUP                                              │
│ Split view:                                                     │
│ LEFT: iPhone mockup showing RunTag app (chain: 4 days)          │
│ RIGHT: Illustrated tree with NFC tag sticker on trunk           │
│                                                                 │
│ Text: "It's 7am. You're at the edge of the woods."              │
│       "Your RunTag is waiting."                                 │
│                                                                 │
│ [Tap the tag to start your run →]                               │
│ (User must click/tap the NFC tag on the tree)                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ SCENE 3: TAP IN                                                 │
│ Animation: Phone moves toward tag, NFC ripple effect            │
│ iPhone screen updates: "TAGGED - Run started"                   │
│ Sound: Subtle haptic/tap sound                                  │
│                                                                 │
│ Text: "You're in. Now go."                                      │
│                                                                 │
│ [Continue →] (auto-advances after 2s)                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ SCENE 4: THE RUN                                                │
│ Animated illustration: Runner silhouette on trail               │
│ Dotted line showing route through woods                         │
│ Progress indicator (not pace/time - just visual movement)       │
│                                                                 │
│ Text: "No pace to check. No watch to glance at."                │
│       "Just you and the trail."                                 │
│                                                                 │
│ (5 second animation, then auto-advances)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ SCENE 5: TAP OUT                                                │
│ Same split view as Scene 2                                      │
│ Tree tag is now glowing/pulsing                                 │
│                                                                 │
│ Text: "Run complete. Tap out."                                  │
│                                                                 │
│ [Tap the tag to finish →]                                       │
│ (User must click/tap the NFC tag again)                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ SCENE 6: CHAIN GROWS                                            │
│ iPhone screen animates:                                         │
│ - Big checkmark appears                                         │
│ - "DAY 5" counter increments with celebration                   │
│ - Chain visual: ✓ ✓ ✓ ✓ ✓                                       │
│                                                                 │
│ Text: "Day 5. Chain unbroken."                                  │
│       "That's it. That's all that matters."                     │
│                                                                 │
│ [See what's next →]                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ SCENE 7: DISCOVERY TEASE                                        │
│ Map view showing multiple tag locations                         │
│ Other users' routes as faded paths                              │
│                                                                 │
│ Text: "Bored of your usual loop?"                               │
│       "Discover routes others have created."                    │
│       "Or create your own for others to find."                  │
│                                                                 │
│ [Get RunTag →] (CTA to app store / waitlist)                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ SCENE 8: CTA                                                    │
│ "Stop optimizing. Start moving."                                │
│                                                                 │
│ [Join the Waitlist] - email capture                             │
│ [Get Starter Kit] - 3 tags + app link                           │
│                                                                 │
│ Social proof: "2,847 chains unbroken this week"                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Visual Design Specifications

### Color Palette
```css
:root {
  --black: #0a0a0a;
  --white: #f5f5f0;
  --green: #34c759;        /* Success, chain, CTA */
  --green-dark: #2da44e;
  --red: #ff3b30;          /* Emphasis, broken chain */
  --orange: #ff9500;       /* Warning, at-risk */
  --gray: #666666;
  --gray-light: #1a1a1a;
  --forest: #1a2e1a;       /* Woods/nature tint */
}
```

### Typography
```css
/* Headlines */
font-family: 'Bebas Neue', sans-serif;
text-transform: uppercase;
letter-spacing: -0.02em;

/* Body/UI */
font-family: 'JetBrains Mono', monospace;
```

### Design Principles
1. **Brutalist, not polished** - Raw, honest, confrontational
2. **Dark mode only** - Feels like early morning / dusk runs
3. **Minimal illustration** - Silhouettes, not detailed art
4. **Motion with purpose** - Every animation serves the narrative

### iPhone Mockup
- Use realistic iPhone 15 Pro frame
- Screen shows actual RunTag app UI
- Must be responsive (scales down on mobile)

### Tree/Tag Illustration
- Simple, stylized tree silhouette
- NFC tag is a small circle/square on trunk
- Tag should glow/pulse when interactive
- Click/tap target should be generous (min 48x48px)

---

## 4. Invariants (MUST ALWAYS BE TRUE)

These are the contracts the demo makes. Every invariant has a Playwright test. Use the specflow framework as specified in the specflow folder in the root to enhance these and create tests 

### INV-D1: Linear Progression
```
The user MUST complete each scene before advancing.
Scenes cannot be skipped.
The only way to go back is to restart the demo.
```

### INV-D2: Required Interactions
```
Scene 2 (Setup) -> Scene 3 (Tap In): Requires user to click the NFC tag
Scene 5 (Tap Out) -> Scene 6 (Chain): Requires user to click the NFC tag
All other transitions can be automatic or button-driven.
```

### INV-D3: Chain Consistency
```
The chain count shown in the iPhone mockup MUST be:
- Scene 2: 4 days
- Scene 6: 5 days (incremented by 1)
The chain visual MUST show exactly [chain_count] checkmarks.
```

### INV-D4: No Metrics Displayed
```
The demo MUST NOT display:
- Pace
- Distance
- Time/duration
- Calories
- Heart rate
- Any comparative stats
```

### INV-D5: Interaction Feedback
```
When user taps the NFC tag:
- Visual feedback MUST appear within 100ms
- NFC ripple animation MUST play
- Scene transition MUST begin within 500ms
```

### INV-D6: Responsive Integrity
```
On mobile (< 768px):
- iPhone mockup and tree MUST stack vertically
- All tap targets MUST be minimum 48x48px
- Text MUST remain readable (min 16px body)
```

### INV-D7: Accessibility
```
All interactive elements MUST be keyboard accessible.
All images MUST have alt text.
Color contrast MUST meet WCAG AA.
Focus states MUST be visible.
```

---

## 5. User Stories with Acceptance Criteria

### US-1: First-time Visitor Hook
```gherkin
Feature: Landing hook captures attention

Scenario: Visitor sees provocative headline
  Given I am a new visitor
  When I land on the demo page
  Then I should see the headline "Your watch is making you fat"
  And I should see a "Try RunTag Demo" button
  And the page should load in under 2 seconds
```

### US-2: Starting the Demo
```gherkin
Feature: Demo begins with clear setup

Scenario: User enters the demo experience
  Given I am on the landing section
  When I click "Try RunTag Demo"
  Then I should see Scene 2 (The Setup)
  And I should see an iPhone showing "4 day chain"
  And I should see a tree with an NFC tag
  And I should see text "Tap the tag to start your run"
```

### US-3: Tap In Interaction
```gherkin
Feature: User taps NFC tag to start run

Scenario: Successful tap in
  Given I am on Scene 2 (The Setup)
  When I click on the NFC tag on the tree
  Then I should see an NFC ripple animation
  And the iPhone screen should show "TAGGED - Run started"
  And Scene 3 should display "You're in. Now go."
  And Scene 4 should begin within 3 seconds

Scenario: Tag is keyboard accessible
  Given I am on Scene 2 (The Setup)
  When I focus the NFC tag with Tab key
  And I press Enter
  Then the tap in sequence should trigger
```

### US-4: Run Animation
```gherkin
Feature: Run sequence plays automatically

Scenario: Visual run narrative
  Given I have tapped in (Scene 3 complete)
  When Scene 4 (The Run) begins
  Then I should see a runner silhouette animation
  And I should see a dotted path being drawn
  And I should NOT see any pace or time metrics
  And Scene 5 should begin after 5 seconds
```

### US-5: Tap Out Interaction
```gherkin
Feature: User taps NFC tag to end run

Scenario: Successful tap out
  Given I am on Scene 5 (Tap Out)
  And the NFC tag is glowing/pulsing
  When I click on the NFC tag
  Then the iPhone screen should animate to success state
  And I should see "DAY 5" with celebration animation
  And the chain visual should show 5 checkmarks
```

### US-6: Chain Celebration
```gherkin
Feature: Chain growth is celebrated

Scenario: Day counter increments
  Given I have just tapped out
  When the success animation plays
  Then the day counter should animate from 4 to 5
  And each chain checkmark should appear sequentially
  And I should see text "Day 5. Chain unbroken."
```

### US-7: Discovery Tease
```gherkin
Feature: Discovery feature is previewed

Scenario: User sees route discovery
  Given I have completed the tap out celebration
  When I click "See what's next"
  Then I should see a map with multiple tag locations
  And I should see text about discovering routes
  And I should see a CTA to continue
```

### US-8: Conversion CTA
```gherkin
Feature: Demo ends with conversion opportunity

Scenario: User reaches final CTA
  Given I am on the final scene
  Then I should see "Stop optimizing. Start moving."
  And I should see a waitlist signup form
  And I should see a "Get Starter Kit" option
```

### US-9: Demo Restart
```gherkin
Feature: User can restart demo

Scenario: Restart from any point
  Given I am on any scene after Scene 1
  When I click the "Restart Demo" button
  Then I should return to Scene 1
  And all state should be reset
```

### US-10: Mobile Experience
```gherkin
Feature: Demo works on mobile devices

Scenario: Mobile layout adaptation
  Given I am viewing on a device with width < 768px
  Then the iPhone and tree should stack vertically
  And all text should be readable
  And all tap targets should be at least 48x48px
```

---

## 6. Technical Implementation

### Project Structure
```
runtag-demo/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # Main demo page
│   └── globals.css
├── components/
│   ├── scenes/
│   │   ├── Scene1Hook.tsx
│   │   ├── Scene2Setup.tsx
│   │   ├── Scene3TapIn.tsx
│   │   ├── Scene4Run.tsx
│   │   ├── Scene5TapOut.tsx
│   │   ├── Scene6Chain.tsx
│   │   ├── Scene7Discovery.tsx
│   │   └── Scene8CTA.tsx
│   ├── IPhoneMockup.tsx      # Reusable phone frame
│   ├── NFCTag.tsx            # Interactive tag component
│   ├── TreeIllustration.tsx  # SVG tree with tag
│   ├── ChainVisual.tsx       # Row of checkmarks
│   ├── RunnerAnimation.tsx   # Lottie or CSS animation
│   └── NFCRipple.tsx         # Tap feedback animation
├── hooks/
│   ├── useDemoState.ts       # Scene progression state
│   └── useChainCount.ts      # Chain counter logic
├── lib/
│   └── constants.ts          # Colors, timing, copy
├── tests/
│   ├── e2e/
│   │   ├── demo-flow.spec.ts
│   │   ├── interactions.spec.ts
│   │   ├── accessibility.spec.ts
│   │   └── mobile.spec.ts
│   └── invariants/
│       └── invariants.spec.ts
├── public/
│   ├── fonts/
│   └── images/
├── playwright.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### State Management
```typescript
// hooks/useDemoState.ts
type Scene = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface DemoState {
  currentScene: Scene;
  chainCount: number;
  hasTappedIn: boolean;
  hasTappedOut: boolean;
  isAnimating: boolean;
}

const initialState: DemoState = {
  currentScene: 1,
  chainCount: 4,
  hasTappedIn: false,
  hasTappedOut: false,
  isAnimating: false,
};

// Actions
type DemoAction =
  | { type: 'START_DEMO' }
  | { type: 'TAP_IN' }
  | { type: 'COMPLETE_RUN' }
  | { type: 'TAP_OUT' }
  | { type: 'ADVANCE_SCENE' }
  | { type: 'RESTART' };
```

### Key Component: NFCTag
```typescript
// components/NFCTag.tsx
interface NFCTagProps {
  isGlowing: boolean;
  isInteractive: boolean;
  onTap: () => void;
}

// Must meet INV-D2 (required interaction) and INV-D5 (feedback timing)
// - onClick triggers onTap
// - onKeyDown (Enter/Space) triggers onTap for accessibility
// - Visual feedback within 100ms
// - Minimum 48x48px touch target
```

### Animation Timing Constants
```typescript
// lib/constants.ts
export const TIMING = {
  NFC_RIPPLE_DURATION: 600,      // ms
  SCENE_TRANSITION: 500,         // ms
  RUN_ANIMATION_DURATION: 5000,  // ms
  CHAIN_INCREMENT_DELAY: 300,    // ms per checkmark
  AUTO_ADVANCE_DELAY: 2000,      // ms
} as const;
```

---

## 7. Playwright Test Specifications

### Test File: invariants.spec.ts
```typescript
import { test, expect } from '@playwright/test';

test.describe('Demo Invariants', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // INV-D1: Linear Progression
  test('INV-D1: scenes cannot be skipped', async ({ page }) => {
    // Should start at Scene 1
    await expect(page.getByTestId('scene-1')).toBeVisible();
    
    // Cannot access Scene 3 directly
    await page.goto('/#scene-3');
    await expect(page.getByTestId('scene-1')).toBeVisible();
  });

  // INV-D2: Required Interactions
  test('INV-D2: must tap tag to advance from Scene 2', async ({ page }) => {
    await page.getByRole('button', { name: /try runtag demo/i }).click();
    await expect(page.getByTestId('scene-2')).toBeVisible();
    
    // Try to advance without tapping - should not work
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('scene-2')).toBeVisible();
    
    // Tap the tag - should advance
    await page.getByTestId('nfc-tag').click();
    await expect(page.getByTestId('scene-3')).toBeVisible({ timeout: 1000 });
  });

  // INV-D3: Chain Consistency
  test('INV-D3: chain count increments correctly', async ({ page }) => {
    await page.getByRole('button', { name: /try runtag demo/i }).click();
    
    // Scene 2: Chain should be 4
    await expect(page.getByTestId('chain-count')).toHaveText('4');
    
    // Progress through demo...
    await page.getByTestId('nfc-tag').click();
    await page.waitForTimeout(6000); // Wait for run animation
    await page.getByTestId('nfc-tag').click();
    
    // Scene 6: Chain should be 5
    await expect(page.getByTestId('chain-count')).toHaveText('5');
    
    // Chain visual should have 5 checkmarks
    const checkmarks = page.getByTestId('chain-checkmark');
    await expect(checkmarks).toHaveCount(5);
  });

  // INV-D4: No Metrics Displayed
  test('INV-D4: no performance metrics shown anywhere', async ({ page }) => {
    const forbiddenTerms = ['pace', 'km/h', 'mph', 'calories', 'bpm', 'heart rate', 'distance'];
    
    // Go through entire demo
    await page.getByRole('button', { name: /try runtag demo/i }).click();
    await page.getByTestId('nfc-tag').click();
    await page.waitForTimeout(6000);
    await page.getByTestId('nfc-tag').click();
    await page.getByRole('button', { name: /see what's next/i }).click();
    
    // Check page content for forbidden terms
    const pageText = await page.textContent('body');
    for (const term of forbiddenTerms) {
      expect(pageText?.toLowerCase()).not.toContain(term);
    }
  });

  // INV-D5: Interaction Feedback
  test('INV-D5: tap feedback appears within 100ms', async ({ page }) => {
    await page.getByRole('button', { name: /try runtag demo/i }).click();
    
    const startTime = Date.now();
    await page.getByTestId('nfc-tag').click();
    
    await expect(page.getByTestId('nfc-ripple')).toBeVisible();
    const feedbackTime = Date.now() - startTime;
    
    expect(feedbackTime).toBeLessThan(200); // Allow some margin
  });

  // INV-D6: Responsive Integrity
  test('INV-D6: mobile layout stacks elements vertically', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.getByRole('button', { name: /try runtag demo/i }).click();
    
    const phone = page.getByTestId('iphone-mockup');
    const tree = page.getByTestId('tree-illustration');
    
    const phoneBox = await phone.boundingBox();
    const treeBox = await tree.boundingBox();
    
    // Tree should be below phone (stacked)
    expect(treeBox!.y).toBeGreaterThan(phoneBox!.y + phoneBox!.height - 50);
  });

  test('INV-D6: tap targets are minimum 48x48', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.getByRole('button', { name: /try runtag demo/i }).click();
    
    const tag = page.getByTestId('nfc-tag');
    const box = await tag.boundingBox();
    
    expect(box!.width).toBeGreaterThanOrEqual(48);
    expect(box!.height).toBeGreaterThanOrEqual(48);
  });

  // INV-D7: Accessibility
  test('INV-D7: NFC tag is keyboard accessible', async ({ page }) => {
    await page.getByRole('button', { name: /try runtag demo/i }).click();
    
    // Tab to the NFC tag
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // May need multiple tabs
    
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toHaveAttribute('data-testid', 'nfc-tag');
    
    // Activate with Enter
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('scene-3')).toBeVisible({ timeout: 1000 });
  });
});
```

### Test File: demo-flow.spec.ts
```typescript
import { test, expect } from '@playwright/test';

test.describe('Complete Demo Flow', () => {
  
  test('US-1 to US-8: Full user journey', async ({ page }) => {
    await page.goto('/');
    
    // US-1: Hook
    await expect(page.getByText(/your watch is making you fat/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /try runtag demo/i })).toBeVisible();
    
    // US-2: Start demo
    await page.getByRole('button', { name: /try runtag demo/i }).click();
    await expect(page.getByTestId('iphone-mockup')).toBeVisible();
    await expect(page.getByTestId('tree-illustration')).toBeVisible();
    await expect(page.getByText(/tap the tag to start/i)).toBeVisible();
    
    // US-3: Tap in
    await page.getByTestId('nfc-tag').click();
    await expect(page.getByTestId('nfc-ripple')).toBeVisible();
    await expect(page.getByText(/you're in/i)).toBeVisible({ timeout: 2000 });
    
    // US-4: Run animation (wait for it)
    await expect(page.getByTestId('runner-animation')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/no pace to check/i)).toBeVisible();
    
    // US-5: Tap out
    await expect(page.getByTestId('nfc-tag')).toBeVisible({ timeout: 7000 });
    await expect(page.getByText(/tap out/i)).toBeVisible();
    await page.getByTestId('nfc-tag').click();
    
    // US-6: Chain celebration
    await expect(page.getByText(/day 5/i)).toBeVisible({ timeout: 2000 });
    await expect(page.getByText(/chain unbroken/i)).toBeVisible();
    
    // US-7: Discovery
    await page.getByRole('button', { name: /see what's next/i }).click();
    await expect(page.getByText(/discover routes/i)).toBeVisible();
    
    // US-8: CTA
    await page.getByRole('button', { name: /get runtag/i }).click();
    await expect(page.getByText(/stop optimizing/i)).toBeVisible();
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
  });

  test('US-9: Demo can be restarted', async ({ page }) => {
    await page.goto('/');
    
    // Progress partway through
    await page.getByRole('button', { name: /try runtag demo/i }).click();
    await page.getByTestId('nfc-tag').click();
    
    // Restart
    await page.getByRole('button', { name: /restart/i }).click();
    
    // Should be back at Scene 1
    await expect(page.getByText(/your watch is making you fat/i)).toBeVisible();
  });
});
```

### Test File: mobile.spec.ts
```typescript
import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Experience', () => {
  
  test.use({ ...devices['iPhone 13'] });

  test('US-10: Demo works on mobile', async ({ page }) => {
    await page.goto('/');
    
    // All content should be visible
    await expect(page.getByText(/your watch is making you fat/i)).toBeVisible();
    
    // Start demo
    await page.getByRole('button', { name: /try runtag demo/i }).click();
    
    // Elements should be stacked
    await expect(page.getByTestId('iphone-mockup')).toBeVisible();
    await expect(page.getByTestId('tree-illustration')).toBeVisible();
    
    // Tap should work with touch
    await page.getByTestId('nfc-tag').tap();
    await expect(page.getByTestId('scene-3')).toBeVisible({ timeout: 1000 });
  });
});
```

### Test File: accessibility.spec.ts
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  
  test('page should have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('all interactive elements have visible focus states', async ({ page }) => {
    await page.goto('/');
    
    const button = page.getByRole('button', { name: /try runtag demo/i });
    await button.focus();
    
    // Should have visible focus indicator
    const outline = await button.evaluate(el => 
      window.getComputedStyle(el).outlineWidth
    );
    expect(parseInt(outline)).toBeGreaterThan(0);
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /try runtag demo/i }).click();
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
});
```

---

## 8. Copy & Messaging

### Scene 1: Hook
```
Headline: "Your watch is making you fat."
Subhead: "You spent £400 on metrics. You haven't run in three weeks."
CTA: "Try RunTag Demo →"
```

### Scene 2: Setup
```
"It's 7am. You're at the edge of the woods."
"Your RunTag is waiting."
CTA: "Tap the tag to start your run →"
```

### Scene 3: Tap In
```
"You're in. Now go."
```

### Scene 4: Run
```
"No pace to check. No watch to glance at."
"Just you and the trail."
```

### Scene 5: Tap Out
```
"Run complete. Tap out."
```

### Scene 6: Chain
```
"Day 5. Chain unbroken."
"That's it. That's all that matters."
CTA: "See what's next →"
```

### Scene 7: Discovery
```
"Bored of your usual loop?"
"Discover routes others have created."
"Or plant your own tags for others to find."
CTA: "Get RunTag →"
```

### Scene 8: CTA
```
Headline: "Stop optimizing. Start moving."
CTA 1: "Join the Waitlist"
CTA 2: "Get Starter Kit - £19"
Social proof: "2,847 chains unbroken this week"
```

---

## 9. Build Commands

```bash
# Initialize project
npx create-next-app@latest runtag-demo --typescript --tailwind --app --src-dir=false

# Install dependencies
npm install framer-motion @radix-ui/react-slot class-variance-authority clsx tailwind-merge

# Install dev dependencies
npm install -D playwright @playwright/test @axe-core/playwright

# Initialize Playwright
npx playwright install

# Run dev server
npm run dev

# Run tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/invariants.spec.ts

# Run tests with UI
npx playwright test --ui
```

---

## 10. Definition of Done

The demo is complete when:

- [ ] All 8 scenes render correctly
- [ ] User can complete full journey from Scene 1 to Scene 8
- [ ] NFC tag tap interactions work (click + keyboard)
- [ ] Chain count increments from 4 to 5
- [ ] Run animation plays for ~5 seconds
- [ ] All invariant tests pass
- [ ] All user story tests pass
- [ ] Accessibility tests pass (zero Axe violations)
- [ ] Mobile layout works (iPhone 13 viewport)
- [ ] Page loads in < 2 seconds
- [ ] Deployed to Vercel

---

## 11. Reference Assets

### Landing Page HTML
See: `runtag-landing.html` (provided separately)

### App Demo HTML
See: `runtag-app-demo.html` (provided separately)

Use these as visual references for the iPhone mockup UI and overall aesthetic.

---

*Build this demo to convert visitors into runners.*
*No metrics. Just momentum.*
