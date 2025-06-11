const fs = require('fs');
const path = require('path');
const generateInstructions = require('../scripts/changeRequestInterpreter');

describe('changeRequestInterpreter', () => {
  const changeRequests = path.resolve(__dirname, '../changeRequests.json');
  const expectedFile = path.resolve(__dirname, '../changeRequestInstructions.txt');
  const outputFile = path.join(__dirname, 'output.txt');

  afterAll(() => {
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }
  });

  test('generates instructions matching existing file', () => {
    generateInstructions(changeRequests, outputFile);
    const expected = fs.readFileSync(expectedFile, 'utf8').trim();
    const actual = fs.readFileSync(outputFile, 'utf8').trim();
    expect(actual).toBe(expected);
  });
});
