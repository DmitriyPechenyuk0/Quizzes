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
    let answers = el.lastElementChild.textContent.split(' ')[2].split('|')
    let tAns = []
    
    answers.forEach(el => {
        if(el.split(':')[1] === 'true'){
            tAns.push(el.split(':')[0])
        }
    })
    el.lastElementChild.textContent = `Правильні відповідь: ${tAns.join(', ')}`
})


document.querySelectorAll('.truthy').forEach(el => {
    let answers = el.lastElementChild.textContent.split(' ')[1].split('|')
    let tAns = []
    
    answers.forEach(el => {
        if(el.split(':')[1] === 'true'){
            tAns.push(el.split(':')[0])
        }
    })
    el.lastElementChild.textContent = `Відповідь: ${tAns.join(', ')}`
})