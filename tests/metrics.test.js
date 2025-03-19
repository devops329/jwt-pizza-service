const {
    getRequests,
    incrementActiveUsers,
    decrementActiveUsers,
    incrementSuccessfulAuthAttempts,
    incrementFailedAuthAttempts,
    incrementPizzasMade,
    incrementFailedPizzas,
    addLatency,
    addPizzaLatency,
    sendMetricsPeriodically,
    getCpuUsagePercentage,
    getMemoryUsagePercentage
  } = require('../src/metrics'); // Adjusted import based on your directory structure
  
  jest.mock('os', () => ({
    loadavg: () => [1.2],
    cpus: () => [{}, {}, {}], // Simulating 3 CPU cores
    totalmem: () => 16 * 1024 * 1024 * 1024, // 16GB
    freemem: () => 8 * 1024 * 1024 * 1024 // 8GB free
  }));
  
  describe('Metrics Functions', () => {
    let requestsByMethod;
    let activeUsers;
    let successfulAuthAttempts;
    let failedAuthAttempts;
    let pizzasMade;
    let totalPrice;
    let pizzaCreationFails;
    let generalLatency;
    let pizzaLatency;
  
    beforeEach(() => {
      // Initialize state for each test
      requestsByMethod = { GET: 0, POST: 0, DELETE: 0, PUT: 0 };
      activeUsers = 0;
      successfulAuthAttempts = 0;
      failedAuthAttempts = 0;
      pizzasMade = 0;
      totalPrice = 0;
      pizzaCreationFails = 0;
      generalLatency = 0;
      pizzaLatency = 0;
    });
  
    test('getRequests increments request method count', () => {
      const req = { method: 'GET' };
      const res = {};
      const next = jest.fn();
  
      getRequests(req, res, next);
  
      expect(requestsByMethod.GET).toBe(1);
      expect(next).toHaveBeenCalled();
    });
  
    test('incrementActiveUsers increases activeUsers count', () => {
      incrementActiveUsers();
      expect(activeUsers).toBe(1);
    });
  
    test('decrementActiveUsers decreases activeUsers count', () => {
      incrementActiveUsers();
      decrementActiveUsers();
      expect(activeUsers).toBe(0);
    });
  
    test('incrementSuccessfulAuthAttempts increments successfulAuthAttempts', () => {
      incrementSuccessfulAuthAttempts();
      expect(successfulAuthAttempts).toBe(1);
    });
  
    test('incrementFailedAuthAttempts increments failedAuthAttempts', () => {
      incrementFailedAuthAttempts();
      expect(failedAuthAttempts).toBe(1);
    });
  
    test('incrementPizzasMade increments pizzasMade and totalPrice', () => {
      incrementPizzasMade(5, 50);
      expect(pizzasMade).toBe(5);
      expect(totalPrice).toBe(250);
    });
  
    test('incrementFailedPizzas increments pizzaCreationFails', () => {
      incrementFailedPizzas();
      expect(pizzaCreationFails).toBe(1);
    });
  
    test('addLatency increments generalLatency', () => {
      addLatency(100);
      expect(generalLatency).toBe(100);
    });
  
    test('addPizzaLatency increments pizzaLatency', () => {
      addPizzaLatency(50);
      expect(pizzaLatency).toBe(50);
    });
  
    test('getCpuUsagePercentage returns a value as a string percentage', () => {
      const cpuUsage = getCpuUsagePercentage();
      expect(cpuUsage).toBe('33.33'); // 1.2 load avg / 3 CPUs = 0.4 * 100
    });
  
    test('getMemoryUsagePercentage returns the correct memory usage percentage', () => {
      const memoryUsage = getMemoryUsagePercentage();
      expect(memoryUsage).toBe('50.00'); // 8GB used of 16GB
    });
  
    test('sendMetricsPeriodically does not throw error', () => {
      // Just verify that no error is thrown when the function is invoked
      expect(() => sendMetricsPeriodically(1000)).not.toThrow();
    });
  });
  