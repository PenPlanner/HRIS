/**
 * Double-click debugging test
 *
 * This test helps diagnose why double-click isn't working in React Flow
 */

describe('Double-click event debugging', () => {
  test('event.detail behavior', () => {
    // Simulate what browser does
    const clickEvent1 = new MouseEvent('click', { detail: 1 });
    const clickEvent2 = new MouseEvent('click', { detail: 2 });

    console.log('First click detail:', clickEvent1.detail);
    console.log('Second click detail:', clickEvent2.detail);

    expect(clickEvent1.detail).toBe(1);
    expect(clickEvent2.detail).toBe(2);
  });

  test('timer-based double-click detection', (done) => {
    let singleClickFired = false;
    let doubleClickFired = false;

    const clickTimerRef = { current: null as NodeJS.Timeout | null };
    const isDoubleClickingRef = { current: false };

    // Simulate single click handler
    const handleClick = (eventDetail: number) => {
      if (eventDetail === 1) {
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
        }
        clickTimerRef.current = setTimeout(() => {
          if (!isDoubleClickingRef.current) {
            singleClickFired = true;
            console.log('Single click fired');
          }
          isDoubleClickingRef.current = false;
        }, 200);
      }
    };

    // Simulate double click handler
    const handleDoubleClick = () => {
      isDoubleClickingRef.current = true;
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      doubleClickFired = true;
      console.log('Double click fired');
    };

    // Simulate double-click sequence
    handleClick(1); // First click
    setTimeout(() => {
      handleDoubleClick(); // Double click within 200ms
    }, 50);

    // Wait and check results
    setTimeout(() => {
      expect(doubleClickFired).toBe(true);
      expect(singleClickFired).toBe(false);
      done();
    }, 300);
  });
});
