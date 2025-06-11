export const loadScript = jest.fn(() => {
  window.ApexCharts = jest.fn().mockImplementation(() => ({
    render: jest.fn(),
    updateOptions: jest.fn()
  }));
  return Promise.resolve();
});

export const loadStyle = jest.fn(() => Promise.resolve());
