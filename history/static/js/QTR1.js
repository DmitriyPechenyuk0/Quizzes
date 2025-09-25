const quests = {
    firstQuestion: 100,
    secondQuestion: 50,
    thirdQuestion: 0,
    fourQuestion: 100,
}



var myChart = echarts.init(document.getElementById('main'));

var option = {
    title: {
    text: 'Результати групи з питань'
    },
    tooltip: {},
    legend: {
    data: ['questions']
    },
    xAxis: {
    data: ['Питання 1', 'Питання 2', 'Питання 3', 'Питання 4']
    },
    yAxis: {},
    series: [
    {
        type: 'bar',
        data: [quests.firstQuestion, quests.secondQuestion, quests.thirdQuestion, quests.fourQuestion]
    }
    ]
};

myChart.setOption(option);