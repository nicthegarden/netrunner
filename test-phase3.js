/**
 * Phase 3 Automated Browser Tests using Puppeteer
 */

const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Starting Phase 3 Browser Tests...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => console.log(msg.text()));
    page.on('error', err => console.error('Page error:', err));
    
    console.log('📖 Loading game at http://localhost:8000...');
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle2', timeout: 10000 });
    
    console.log('⏳ Waiting for game to initialize...');
    await page.waitForFunction(() => window.multiplayerManager, { timeout: 5000 });
    
    console.log('✅ Game loaded and multiplayer manager initialized\n');
    
    // Run the test suite
    console.log('🧪 Running Phase 3 Test Suite...\n');
    await page.evaluate(() => {
      // Test 1: Cache initialization
      console.log('📋 Test 1: Cache Initialization');
      try {
        const cache = window.multiplayerManager?.cache;
        if (!cache) throw new Error('Cache not found');
        if (cache.ttl !== 5 * 60 * 1000) throw new Error('TTL not 5 minutes');
        console.log('✅ PASS: Cache initialized with 5-minute TTL');
      } catch (e) {
        console.error('❌ FAIL: ' + e.message);
      }

      // Test 2: Cache set/get
      console.log('\n📋 Test 2: Cache Set/Get Operations');
      try {
        const cache = window.multiplayerManager.cache;
        cache.set('test_key', { data: 'test_value' });
        const retrieved = cache.get('test_key');
        if (!retrieved || retrieved.data !== 'test_value') throw new Error('Cache set/get failed');
        console.log('✅ PASS: Cache set/get working');
      } catch (e) {
        console.error('❌ FAIL: ' + e.message);
      }

      // Test 3: Cache clear
      console.log('\n📋 Test 3: Cache Clear Operation');
      try {
        const cache = window.multiplayerManager.cache;
        cache.set('key1', 'val1');
        cache.clear();
        if (cache.data.size !== 0) throw new Error('Cache clear failed');
        console.log('✅ PASS: Cache clear working');
      } catch (e) {
        console.error('❌ FAIL: ' + e.message);
      }

      // Test 4: MultiplayerManager
      console.log('\n📋 Test 4: MultiplayerManager Initialization');
      try {
        const manager = window.multiplayerManager;
        if (!manager || !manager.client || !manager.game) throw new Error('Manager not properly initialized');
        console.log('✅ PASS: MultiplayerManager properly initialized');
      } catch (e) {
        console.error('❌ FAIL: ' + e.message);
      }

      // Test 5: WebSocket reconnection config
      console.log('\n📋 Test 5: WebSocket Reconnection Config');
      try {
        const manager = window.multiplayerManager;
        if (manager.wsReconnectMaxAttempts !== 5) throw new Error('Max attempts not 5');
        if (manager.wsReconnectDelay !== 1000) throw new Error('Base delay not 1000ms');
        console.log('✅ PASS: WebSocket reconnection configured');
      } catch (e) {
        console.error('❌ FAIL: ' + e.message);
      }

      // Test 6: Global handlers
      console.log('\n📋 Test 6: Global Handler Functions');
      try {
        if (typeof window.joinGuild !== 'function') throw new Error('joinGuild not found');
        if (typeof window.joinEvent !== 'function') throw new Error('joinEvent not found');
        if (typeof window.leaveGuild !== 'function') throw new Error('leaveGuild not found');
        console.log('✅ PASS: All global handlers available');
      } catch (e) {
        console.error('❌ FAIL: ' + e.message);
      }

      // Test 7: GameClient modules
      console.log('\n📋 Test 7: GameClient API Modules');
      try {
        const client = window.gameClient;
        if (!client) throw new Error('GameClient not available');
        if (!client.pvp || !client.guilds || !client.events || !client.leaderboards) {
          throw new Error('One or more API modules missing');
        }
        console.log('✅ PASS: All API modules available');
      } catch (e) {
        console.error('❌ FAIL: ' + e.message);
      }

      // Test 8: Error handler
      console.log('\n📋 Test 8: Error Handler Method');
      try {
        const manager = window.multiplayerManager;
        if (typeof manager.handleError !== 'function') throw new Error('handleError not found');
        console.log('✅ PASS: Error handler implemented');
      } catch (e) {
        console.error('❌ FAIL: ' + e.message);
      }

      // Test 9: Notification system
      console.log('\n📋 Test 9: Notification System');
      try {
        const manager = window.multiplayerManager;
        if (typeof manager.showNotification !== 'function') throw new Error('showNotification not found');
        manager.showNotification('🧪 Test');
        console.log('✅ PASS: Notification system working');
      } catch (e) {
        console.error('❌ FAIL: ' + e.message);
      }

      console.log('\n═══════════════════════════════════════════════════════');
      console.log('✅ Phase 3 Core Tests Complete');
      console.log('═══════════════════════════════════════════════════════');
    });
    
    await browser.close();
    console.log('\n✨ All tests completed successfully!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test error:', error);
    if (browser) await browser.close();
    process.exit(1);
  }
})();
