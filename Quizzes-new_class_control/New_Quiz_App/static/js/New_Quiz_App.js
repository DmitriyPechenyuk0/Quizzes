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

        if (quizData.question && quizData.answers.length > 0) {
            $.ajax({
                url: '/save_quiz',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(quizData),
                success: function() {
                    console.log('Quiz data saved:', quizData);
                    clearForm();
                },
                error: function(error) {
                    console.error('Error saving quiz:', error);
                }
            });
        } else {
            console.log('No valid quiz data to save.');
        }
    });

    function clearForm() {
        $('input[type="text"]').val('');
        $('input[type="checkbox"]').prop('checked', false);
    }

});

