/*
reference: http://www.sciencedirect.com/science/article/pii/S1053811905001424
Cognitive control and brain resources in major depression: An fMRI study using the n-back task Harvey at al. 2005
This task differs in that the subject only has to respond on target trials, rather than indicating whether the current trial is 
a match or not
*/

/* ************************************ */
/* Define helper functions */

/* ************************************ */
function evalAttentionChecks() {
    var check_percent = 1
    if (run_attention_checks) {
        var attention_check_trials = jsPsych.data.getTrialsOfType('attention-check')
        var checks_passed = 0
        for (var i = 0; i < attention_check_trials.length; i++) {
            if (attention_check_trials[i].correct === true) {
                checks_passed += 1
            }
        }
        check_percent = checks_passed / attention_check_trials.length
    }
    return check_percent
}

function declOfNum(number, titles) {
    let cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}

var get_response_time = function () {
    gap = 750 + Math.floor(Math.random() * 500) + 250
    return gap;
}

var getInstructFeedback = function () {
    return '<div class = centerbox><p class = center-block-text>' + feedback_instruct_text +
        '</p></div>'
}

var randomDraw = function (lst) {
    var index = Math.floor(Math.random() * (lst.length))
    return lst[index]
}

//Calculates whether the last trial was correct and records the accuracy in data object
var record_acc = function () {
    var global_trial = jsPsych.progress().current_trial_global
    var stim = jsPsych.data.getData()[global_trial].stim.toLowerCase()
    var target = jsPsych.data.getData()[global_trial].target.toLowerCase()
    var key = jsPsych.data.getData()[global_trial].key_press
    console.log(key)
    if (stim == target && key == 32) {
        correct = true
    } else if (stim != target && key != -1) {
        correct = false
    } else {
        correct = true
    }
    jsPsych.data.addDataToLastTrial({
        correct: correct,
        trial_num: current_trial
    })
    current_trial = current_trial + 1
}


/* ************************************ */
/* Define experimental variables */
/* ************************************ */
// generic task variables
var run_attention_checks = false
var attention_check_thresh = 0.65
var sumInstructTime = 0 //ms
var instructTimeThresh = 0 ///in seconds

// task specific variables
var current_trial = 0
var letters = 'АТРОИ' //АБВГДЕЖЗИКЛМНОП
var num_blocks = 1 //of each delay
var num_trials = 50 // 50
var num_practice_trials = 10 //10
var delays = [1, 2] //jsPsych.randomization.shuffle()
var control_before = Math.round(Math.random()) //0 control comes before test, 1, after
var stims = [] //hold stims per block

/* ************************************ */
/* Set up jsPsych blocks */
/* ************************************ */
// Set up attention check node
var attention_check_block = {
    type: 'attention-check',
    data: {
        trial_id: "attention_check"
    },
    timing_response: 180000,
    response_ends_trial: true,
    timing_post_trial: 200
}

var attention_node = {
    timeline: [attention_check_block],
    conditional_function: function () {
        return run_attention_checks
    }
}

//Set up post task questionnaire
var post_task_block = {
    type: 'survey-text',
    data: {
        trial_id: "post task questions"
    },
    questions: ['<p class = center-block-text style = "font-size: 20px">Кратко опишите, что вас просили сделать в этой задаче.</p>',
        '<p class = center-block-text style = "font-size: 20px">Есть ли у вас комментарии по поводу этой задачи?</p>'],
    rows: [15, 15],
    columns: [60, 60]
};

/* define static blocks */
var feedback_instruct_text = 'Добро пожаловать. Нажмите <strong>Enter</strong>, чтобы начать.';
var feedback_instruct_block = {
    type: 'poldrack-text',
    data: {
        trial_id: "instruction"
    },
    cont_key: [13],
    text: getInstructFeedback,
    timing_post_trial: 0,
    timing_response: 180000
};
/// This ensures that the subject does not read through the instructions too quickly.  If they do it too quickly, then we will go over the loop again.
var instructions_block = {
    type: 'poldrack-instructions',
    data: {
        trial_id: "instruction"
    },
    pages: [
        '<div class = centerbox><p class = block-text>В этом эксперименте ты увидишь последовательность русских букв, отображаемую по очереди. Твоя задача - ответить, нажав клавишу <strong>пробел</strong>, когда буква совпадает с той же буквой, которая появлялась ранее  1 или 2 буквы назад, в противном случае ничего нажимать не нужно. Перед каждым блоком будет написано какие совпадения важно учитывать, если повторяющиеся буквы идут сразу одна за другой или через одну.</p><p class = block-text>Например, если задержка равна 2, тебе нужно нажать клавишу <strong>пробел</strong>, когда текущая буква совпадает с буквой, которая произошла 2 попытки назад. Если бы вы увидели последовательность: А ... Т ... Р ... T ... О ... И ... О, ты бы нажал клавишу <strong>пробел</strong> на последнем "Т" и последней "О", а на остальных буквах ничего не нажимал.</p></div>',
    ],
    allow_keys: false,
    show_clickable_nav: true,
    timing_post_trial: 1000
};

var instruction_node = {
    timeline: [feedback_instruct_block, instructions_block],
    /* This function defines stopping criteria */
    loop_function: function (data) {
        for (i = 0; i < data.length; i++) {
            if ((data[i].trial_type == 'poldrack-instructions') && (data[i].rt != -1)) {
                rt = data[i].rt
                sumInstructTime = sumInstructTime + rt
            }
        }
        if (sumInstructTime <= instructTimeThresh * 1000) {
            feedback_instruct_text =
                'Read through instructions too quickly.  Please take your time and make sure you understand the instructions.  Press <strong>enter</strong> to continue.'
            return true
        } else if (sumInstructTime > instructTimeThresh * 1000) {
            feedback_instruct_text = 'Done with instructions. Press <strong>enter</strong> to continue.'
            return false
        }
    }
}

var end_block = {
    type: 'poldrack-text',
    timing_response: 180000,
    data: {
        trial_id: "end",
        exp_id: 'n_back'
    },
    text: '<div class = centerbox><p class = center-block-text>Спасибо за участие!</p><p class = center-block-text>Нажмите <strong>Enter</strong>, чтобы продолжить.</p></div>',
    cont_key: [13],
    timing_post_trial: 0
};


var start_practice_block = {
    type: 'poldrack-text',
    text: '<div class = centerbox><p class = center-block-text><strong>Задача 1-назад</strong></p><p class = block-text>В этом эксперименте ты увидишь последовательность русских букв, отображаемых по очереди.</p><p class = block-text>Если <strong>новая буква совпадает предыдущей</strong>, тебе нужно сразу нажать ПРОБЕЛ. Если соседние буквы не совпадают, то ничего нажимать не нужно.</p><p class = block-text>Например, в последовательности “А … Г … Т … <strong>Т</strong> … О … <strong>О</strong> … М” надо нажимать пробел на вторую Т и вторую О.</p><p class = block-text>Сейчас будет короткая тренировка, где компьютер тебе подскажет, правильно ты ответил или нет. Затем тренировка закончится и мы начнем саму задачу.</p><p class = center-block-text>Нажмите <strong>Enter</strong>, чтобы начать.</p></div>',
    cont_key: [13],
    data: {
        trial_id: "instruction"
    },
    timing_response: 180000,
    timing_post_trial: 1000
};

var start_practice_2_back_block = {
    type: 'poldrack-text',
    text: '<div class = centerbox><p class = block-text>Теперь новая задачка! Сейчас, если <strong>буквы совпадают ЧЕРЕЗ одну</strong>, а не соседние, тогда нужно нажимать ПРОБЕЛ. Если не совпадают, то не нажимай ничего.</p><p class = block-text>Например, в последовательности “А … Т … Р … <strong>T</strong> … О … И … <strong>О</strong>” надо нажимать пробел на вторую Т и вторую О.</p><p class = block-text>Сейчас будет короткая тренировка, где компьютер тебе подскажет, правильно ты ответил или нет. Затем тренировка закончится и мы начнем саму задачу.</p><p class = center-block-text>Нажмите <strong>Enter</strong>, чтобы начать.</p></div>',
    cont_key: [13],
    data: {
        trial_id: "instruction_2_back"
    },
    timing_response: 180000,
    timing_post_trial: 1000
};

var start_test_block = {
    type: 'poldrack-text',
    data: {
        trial_id: "test_intro"
    },
    timing_response: 180000,
    text: '<div class = centerbox><p class = center-block-text>Начинаем тестирование.</p><p class = center-block-text>Нажмите <strong>Enter</strong>, чтобы начать.</p></div>',
    cont_key: [13],
    timing_post_trial: 1000
};

var end_test_block_1 = {
    type: 'poldrack-text',
    data: {
        trial_id: "test_intro"
    },
    timing_response: 180000,
    text: '<div class = centerbox><p class = center-block-text>Молодец! Задача 1-назад пройдена.</p><p class = center-block-text>Нажмите <strong>Enter</strong>, чтобы продолжить.</p></div>',
    cont_key: [13],
    timing_post_trial: 1000
};

    var start_control_block = {
    type: 'poldrack-text',
    timing_response: 180000,
    data: {
        trial_id: "control_intro"
    },
    text: '<div class = centerbox><p class = block-text>In this block you do not have to match letters to previous letters. Instead, press the left arrow key everytime you see a "t" or "T" and the down arrow key for all other letters.</p><p class = center-block-text>Press <strong>enter</strong> to begin.</p></div>',
    cont_key: [13],
    timing_post_trial: 1000
};

var outro_test_block = {
    type: 'poldrack-text',
    is_html: true,
    data: {
        trial_id: "test_outro"
    },
    timing_stim: 2000,
    timing_response: 2000,
    timing_post_trial: 0,
    text: '<div class = centerbox><div class="img-container"><img src="images/outro.jpg" alt="Молодец"></div></div>',
};

//Setup 1-back practice
practice_trials = []
for (var i = 0; i < (num_practice_trials); i++) {
    var stim = randomDraw(letters)
    stims.push(stim)
    if (i >= 1) {
        target = stims[i - 1]
    }
    if (stim == target) {
        correct_response = 32
    } else {
        correct_response = -1
    }
    var practice_block = {
        type: 'poldrack-categorize',
        is_html: true,
        stimulus: '<div class = centerbox><div class = center-text>' + stim + '</div></div>',
        key_answer: correct_response,
        data: {
            trial_id: "stim",
            exp_stage: "practice",
            stim: stim,
            target: target
        },
        correct_text: '<div class = centerbox><div style="color:green;font-size:60px"; class = center-text>Верно!</div></div>',
        incorrect_text: '<div class = centerbox><div style="color:red;font-size:60px"; class = center-text>Неверно</div></div>',
        timeout_message: '<div class = centerbox><div style="font-size:60px" class = center-text>Respond Faster!</div></div>',
        // timing_feedback_duration: 500,
        show_stim_with_feedback: false,
        choices: [32],
        show_feedback_on_timeout: true,
        timing_stim: 500,
        timing_response: 2000,
        timing_post_trial: 500
    };
    practice_trials.push(practice_block)
}

//Setup 2-back practice
practice_trials_2_back = []
stims = []
for (var i = 0; i < (num_practice_trials); i++) {
    target = ''
    stim = randomDraw(letters)
    stims.push(stim)
    if (i >= 2) {
        target = stims[i - 2]
    }
    if (stim == target) {
        correct_response = 32
    } else {
        correct_response = -1
    }
    var practice_block_2_back = {
        type: 'poldrack-categorize',
        is_html: true,
        stimulus: '<div class = centerbox><div class = center-text>' + stim + '</div></div>',
        key_answer: correct_response,
        data: {
            trial_id: "stim",
            exp_stage: "practice",
            stim: stim,
            target: target
        },
        correct_text: '<div class = centerbox><div style="color:green;font-size:60px"; class = center-text>Верно!</div></div>',
        incorrect_text: '<div class = centerbox><div style="color:red;font-size:60px"; class = center-text>Неверно</div></div>',
        timeout_message: '<div class = centerbox><div style="font-size:60px" class = center-text>Respond Faster!</div></div>',
        // timing_feedback_duration: 500,
        show_stim_with_feedback: false,
        choices: [32],
        show_feedback_on_timeout: true,
        timing_stim: 500,
        timing_response: 2000,
        timing_post_trial: 500
    };
    practice_trials_2_back.push(practice_block_2_back)
}

//Define control (0-back) block
var control_trials = []
for (var i = 0; i < num_trials; i++) {
    var stim = randomDraw(letters)
    var control_block = {
        type: 'poldrack-single-stim',
        is_html: true,
        stimulus: '<div class = centerbox><div class = center-text>' + stim + '</div></div>',
        data: {
            trial_id: "stim",
            exp_stage: "test",
            load: 0,
            stim: stim,
            target: 't'
        },
        choices: [32],
        timing_stim: 500,
        timing_response: 2000,
        timing_post_trial: 0,
        on_finish: record_acc
    };
    control_trials.push(control_block)
}

//Set up experiment
var n_back_experiment = []
// n_back_experiment.push(instruction_node);
n_back_experiment.push(start_practice_block)
n_back_experiment = n_back_experiment.concat(practice_trials)

// if (control_before === 0) {
// 	n_back_experiment.push(start_control_block)
// 	n_back_experiment = n_back_experiment.concat(control_trials)
// }
for (var d = 0; d < delays.length; d++) {
    if (d === 1) {
        n_back_experiment.push(start_practice_2_back_block)
        n_back_experiment = n_back_experiment.concat(practice_trials_2_back)
    }

    var delay = delays[d]
    var start_delay_block = {
        type: 'poldrack-text',
        data: {
            trial_id: "delay_text"
        },
        timing_response: 180000,
        text: d === 0
            ? '<div class = centerbox><p class = block-text>Тренировка пройдена!</p><p class = block-text>Теперь начнем проходить задачу.</p><p class = block-text>Напомню, нажимай ПРОБЕЛ, если <strong>соседние буквы одинаковые</strong>.</p><p class = center-block-text>Нажмите <strong>Enter</strong>, чтобы начать.</p></div>'
            : '<div class = centerbox><p class = block-text>Тренировка пройдена!</p><p class = block-text>Теперь начнем проходить задачу.</p><p class = block-text>Напомню, нажимай ПРОБЕЛ, если <strong>буквы совпадают ЧЕРЕЗ одну</strong>.</p><p class = center-block-text>Нажмите <strong>Enter</strong>, чтобы начать.</p></div>',
        cont_key: [13]
    };
    n_back_experiment.push(start_delay_block)
    for (var b = 0; b < num_blocks; b++) {
        // n_back_experiment.push(start_test_block)
        var target = ''
        stims = []
        for (var i = 0; i < num_trials; i++) {
            var stim = randomDraw(letters)
            stims.push(stim)
            if (i >= delay) {
                target = stims[i - delay]
            }
            var test_block = {
                type: 'poldrack-single-stim',
                is_html: true,
                stimulus: '<div class = centerbox><div class = center-text>' + stim + '</div></div>',
                data: {
                    trial_id: "stim",
                    exp_stage: "test",
                    load: delay,
                    stim: stim,
                    target: target
                },
                choices: [32],
                timing_stim: 500,
                timing_response: 2000,
                timing_post_trial: 0,
                on_finish: record_acc
            };
            n_back_experiment.push(test_block)
        }
    }
    if (d === 0) {
        n_back_experiment.push(end_test_block_1)
    }
    n_back_experiment.push(attention_node)
}
// if (control_before == 1) {
// 	n_back_experiment.push(start_control_block)
// 	n_back_experiment = n_back_experiment.concat(control_trials)
// }
n_back_experiment.push(outro_test_block)
n_back_experiment.push(post_task_block)
n_back_experiment.push(end_block)