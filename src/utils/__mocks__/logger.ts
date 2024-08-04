const mockError = jest.fn();
const mockInfo = jest.fn();

const mockLogger = {
  error: mockError,
  info: mockInfo,
};

export default mockLogger;
