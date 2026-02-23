document.querySelectorAll('.untruthy').forEach(el => {
    let answers = el.firstElementChild.textContent.split(' ')[1].split('|')
    let tAns = []
    
    answers.forEach(el => {
        if(el.split(':')[1] === 'true'){
            tAns.push(el.split(':')[0])
        }
    })
    el.firstElementChild.textContent = `Відповідь: ${tAns.join(', ')}`
})

document.querySelectorAll('.untruthy').forEach(el => {
    let text = el.lastElementChild.textContent;
    
    if (!text.includes('|')) return
    
    let answersText = text.substring(text.lastIndexOf(' ', text.indexOf('|')) + 1)
    let answers = answersText.split('|')
    
    if (answers.length !== 4) return
    
    let tAns = answers
        .filter(answer => answer.split(':')[1] === 'true')
        .map(answer => answer.split(':')[0])
    
    if (tAns.length > 0) {
        el.lastElementChild.textContent = `Правильна відповідь: ${tAns.join(', ')}`
    }
});


document.querySelectorAll('.truthy').forEach(el => {
    let text = el.lastElementChild.textContent
    let answersText = text.includes('Відповідь: ') 
        ? text.split('Відповідь: ')[1] 
        : text

    let answers = answersText.split('|')

    if (answers.length !== 4) return
    
    let tAns = []
    
    answers.forEach(answer => {
        let parts = answer.split(':')
        if (parts[1] === 'true') {
            tAns.push(parts[0])
        }
    })
    
    el.lastElementChild.textContent = `Відповідь: ${tAns.join(', ')}`
})