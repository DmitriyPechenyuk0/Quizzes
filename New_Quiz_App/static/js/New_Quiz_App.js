localStorage.setItem('qIndex', 1)

const imageFiles = new Map();

function handleImageSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  imageFiles.set(parseInt(localStorage.getItem('qIndex')), file);
  updateImagePreview();
}

function updateImagePreview() {
  const preview = document.getElementById('imagePreview');
  const fileInput = document.getElementById('imageInput');
  const currentIndex = parseInt(localStorage.getItem('qIndex'));
  
  if (imageFiles.has(currentIndex)) {
    const file = imageFiles.get(currentIndex);
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
  } else {
    preview.src = '';
    preview.style.display = 'none';
  }
  
  fileInput.value = '';
}

function removeImage() {
    const currentIndex = parseInt(localStorage.getItem('qIndex'));
    imageFiles.delete(currentIndex);
    updateImagePreview();
}

function loadQuestionData() {
    const qIndex = localStorage.getItem('qIndex')
    const questionKey = `question${qIndex}`
    const answerKey = `answer${qIndex}`

    const questionValue = localStorage.getItem(questionKey) || ''
    const answerValue = localStorage.getItem(answerKey) || ''

    const questionInput = document.getElementById('questionInpt')
    const answerInput = document.getElementById('answerInpt')

    if (questionInput) questionInput.value = questionValue
    if (answerInput) answerInput.value = answerValue

    updateImagePreview();
}
loadQuestionData()

const totalQuestions = document.querySelectorAll('.question-bar-setter').length
const questionsData = [];


document.addEventListener('input', function(event) {
    if (event.target && event.target.id === 'answerInpt') {
        let value = event.target.value
        localStorage.setItem(`answer${localStorage.getItem("qIndex")}`, value)
    }
});
document.addEventListener('input', function(event) {
    if (event.target && event.target.id === 'questionInpt') {
        let vale = event.target.value
        localStorage.setItem(`question${localStorage.getItem("qIndex")}`, vale)
    }
});
document.addEventListener('click', function(event) {
    if (event.target && event.target.classList.contains('question-bar-setter')) {
        if(event.target.id != `qq${localStorage.getItem("qIndex")}`){
            localStorage.setItem('qIndex', event.target.id.replace(/\D/g, ''))
            
            loadQuestionData()
        } else{
            return
        }
    }
})

document.addEventListener('click', function(event) {
    if (event.target && event.target.id === 'finish-editing'){
        const formData = new FormData();

        for (let counter = 1; counter <= totalQuestions; counter++) {
            const question = localStorage.getItem(`question${counter}`)
            const answer = localStorage.getItem(`answer${counter}`)
            const qtype = localStorage.getItem(`qtype${counter}`)

            if (question || answer) {
                questionsData.push({
                    id: counter,
                    type: qtype || '',
                    question: question || '',
                    answer: answer || '',
                    hasImage: imageFiles.has(counter)
                })
            }
        }
        formData.append('questions', JSON.stringify(questionsData));
        
        imageFiles.forEach((file, index) => {
            formData.append(`image_${index}`, file);
        });
        
        fetch(`/new-quiz/questions/save/${window.location.href.split('/')[4]}`, {
            method: 'POST',
            body: formData
        })

        localStorage.clear()
        imageFiles.clear()
        window.location.href = `http://127.0.0.1:5000/profile/`
    }
})
document.querySelectorAll('.fill-form').forEach((btn) => {
    btn.addEventListener('click', () => {
        document.querySelector('.active').classList.remove('active')
        btn.classList.add("active")
        localStorage.setItem(`qtype${localStorage.getItem("qIndex")}`, btn.id)
    })
})

document.querySelectorAll('.question-bar-setter').forEach( (ques) => {
    if (localStorage.getItem(`qtype${ques.id[2]}`) != null) return
    localStorage.setItem(`qtype${ques.id[2]}`, 'fform')
})