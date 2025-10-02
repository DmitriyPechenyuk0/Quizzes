// const quests = {
//     firstQuestion: 100,
//     secondQuestion: 50,
//     thirdQuestion: 0,
//     fourQuestion: 100,
    
// }



// var myChart = echarts.init(document.getElementById('main'));

// var option = {
//     title: {
//     text: 'Результати групи з питань'
//     },
//     tooltip: {},
//     legend: {
//     data: ['questions']
//     },
//     xAxis: {
//     data: ['Питання 1', 'Питання 2', 'Питання 3', 'Питання 4']
//     },
//     yAxis: {},
//     series: [
//     {
//         type: 'bar',
//         data: [quests.firstQuestion, quests.secondQuestion, quests.thirdQuestion, quests.fourQuestion]
//     }
//     ]
// };

// myChart.setOption(option);

const quests = {
    firstQuestion: 100,
    secondQuestion: 50,
    thirdQuestion: 0,
    fourQuestion: 100,
};

const chartData = [quests.firstQuestion, quests.secondQuestion, quests.thirdQuestion, quests.fourQuestion];
var myChart = echarts.init(document.getElementById('main'));
const categoryNames = Object.keys(quests).map((_, index) => `${index + 1}`);

var option = {
    title: {
        text: 'Результати групи з питань'
    },
    tooltip: {},
    legend: {
        data: ['questions']
    },

    xAxis: {
        type: 'category',
        data: categoryNames,
        axisLabel: {
            show: true,
            margin: 8, 

            formatter: function (value, index) {
                const questionNumber = index + 1;
                return `${questionNumber}`;
            },
            }
        },

    
    yAxis: {},
    series: [
        {
        type: 'bar',
        data: chartData, 
        label: {
            show: true,
            position: 'top'
        }
        }
    ]
};

myChart.setOption(option);