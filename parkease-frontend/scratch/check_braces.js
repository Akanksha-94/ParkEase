
const fs = require('fs');
const content = fs.readFileSync('src/app/features/reservations/reservations.component.ts', 'utf8');
const stylesMatch = content.match(/styles: \[`([\s\S]*?)`\]/);
if (stylesMatch) {
    const styles = stylesMatch[1];
    let balance = 0;
    for (let i = 0; i < styles.length; i++) {
        if (styles[i] === '{') balance++;
        if (styles[i] === '}') balance--;
    }
    console.log('Brace balance:', balance);
} else {
    console.log('Styles block not found');
}
