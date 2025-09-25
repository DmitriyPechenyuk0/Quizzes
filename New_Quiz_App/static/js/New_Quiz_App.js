$(document).ready(function() {
    $('.big-choice').click(function() {
        $('.big-choice').addClass('active');
        $('.fill-form').removeClass('active');
        $('.large-selection-view').show();
        $('.fill-form-view').hide();
    });

    $('.fill-form').click(function() {
        $('.fill-form').addClass('active');
        $('.big-choice').removeClass('active');
        $('.fill-form-view').show();
        $('.large-selection-view').hide();
    });

    $('.ai-icon, .ia-label').click(function() {
        $('#modalOverlay').addClass('active');
        $('body').css('overflow', 'hidden');
    });

    $('#modalOverlay').click(function(e) {
        if (e.target === this) {
            $(this).removeClass('active');
            $('body').css('overflow', '');
        }
    });

    $(document).keydown(function(e) {
        if (e.key === 'Escape') {
            $('#modalOverlay').removeClass('active');
            $('body').css('overflow', '');
        }
    });

    $('.submit-ai-promt-btn').click(function() {
        var topic = $('.input-ai-promt').val().trim();
        if (topic) {
            console.log('Topic:', topic);
            $.ajax({
                url: '/save_topic',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ topic: topic }),
                success: function(response) {
                    console.log('Topic saved:', response);
                    $('#modalOverlay').removeClass('active');
                    $('body').css('overflow', '');
                },
                error: function(error) {
                    console.error('Error saving topic:', error);
                }
            });
        }
    });

    $('.enter-btn').click(function() {
        let quizData = {
            quiz_name: $('#quiz-name').val().trim() || 'default_quiz',
            mode: '',
            question: '',
            answers: [],
            topic: $('.input-ai-promt').val().trim() || ''
        };

        if ($('.large-selection-view').is(':visible')) {
            quizData.mode = 'large-selection';
            quizData.question = $('.large-selection-view .question-input').val().trim();

            $('.answers-options-frame .answer-container').each(function() {
                let answerText = $(this).find('input[type="text"]').val().trim();
                if (answerText) {
                    quizData.answers.push({
                        text: answerText,
                        correct: $(this).find('.answer-checkbox').prop('checked'),
                    });
                }
            });
        } else {
            quizData.mode = 'fill-form';
            quizData.question = $('.fill-form-view .question-input').val().trim();
            let answerText = $('.fill-form-view .answer-input').val().trim();
            if (answerText) {
                quizData.answers.push({ text: answerText, correct: true });
            }
        }
    });
});


localStorage.setItem('qIndex', 1)


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
        
        for (let counter = 1; counter <= totalQuestions; counter++) {
            const question = localStorage.getItem(`question${counter}`)
            const answer = localStorage.getItem(`answer${counter}`)

            if (question || answer) {
                questionsData.push({
                    id: counter,
                    question: question || '',
                    answer: answer || ''
                })
            }
        }
        let otvet = JSON.stringify(questionsData)
        fetch(`/new-quiz/questions/save/${window.location.href.split('/')[4]}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ questions: questionsData })
        })

        localStorage.clear()
        window.location.href = `http://127.0.0.1:5000/profile/`
    }
})