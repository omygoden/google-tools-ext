// 理解您的需求
// 输入：[{\"data\":\"{\\\"key\\\":\\\"value\\\"}\"}]
// 期望输出：[{"data":"{\"key\":\"value\"}"}]

// 也就是说：
// - 最外层的 \" 变成 "
// - data 值中的 \\\" 变成 \"

// 这需要替换两次！

const input = `[{\\"tag\\":\\"137\\",\\"data\\":\\"{\\\\\\\"audit_status\\\\\\\":3}\\"}]`;

console.log('Input:', input);
console.log('\n---\n');

// 第一次替换
let step1 = input.replace(/\\"/g, '"');
console.log('After 1st replace:', step1);
console.log('Can parse?');
try {
    JSON.parse(step1);
    console.log('NO - still has issues');
} catch (e) {
    console.log('NO:', e.message);
}

console.log('\n---\n');

// 第二次替换
let step2 = step1.replace(/\\"/g, '"');
console.log('After 2nd replace:', step2);
console.log('Can parse?');
try {
    const parsed = JSON.parse(step2);
    console.log('YES!');
    console.log('\nParsed data field:', parsed[0].data);
    console.log('Type:', typeof parsed[0].data);
} catch (e) {
    console.log('NO:', e.message);
}
