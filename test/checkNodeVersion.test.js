const {execSync} = require('child_process');
const path = require('path');

const script = path.resolve(__dirname, '../scripts/checkNodeVersion.js');

describe('checkNodeVersion', () => {
  test('exits for unsupported version', () => {
    const cmd = `node -e "Object.defineProperty(process,'version',{value:'v17.0.0',configurable:true});require('${script.replace(/\\/g,'\\\\')}');"`;
    let code = 0;
    try {
      execSync(cmd, {stdio: 'pipe'});
    } catch (e) {
      code = e.status;
    }
    expect(code).toBe(1);
  });

  test('succeeds for supported version', () => {
    const cmd = `node -e "Object.defineProperty(process,'version',{value:'v18.0.0',configurable:true});require('${script.replace(/\\/g,'\\\\')}');"`;
    const result = execSync(cmd, {stdio: 'pipe'});
    expect(result.toString()).toBe('');
  });
});
