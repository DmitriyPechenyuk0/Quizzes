// $(function(){
//     ;('.result-frame'){
//         "quiz_id": "id",
//         "user_id": "id",
//         "answers": {
//             "question_1": "true",
//             "question_2": "true",
//             "question_3": "false",
//             "question_4": "true",
//             "question_5": "true",
//             "question_6": "false",
//             "question_7": "false",
//             "question_8": "true",
//             "question_9": "false",
//             "question_10": "true"
//         }
//         }
//     }


// )

import * as echarts from 'echarts';

var chartDom = document.getElementById('main');
var myChart = echarts.init(chartDom);
var option;

option = {
  title: {
    text: 'Referer of a Website',
    subtext: 'Fake Data',
    left: 'center'
  },
  tooltip: {
    trigger: 'item'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [
    {
      name: 'Access From',
      type: 'pie',
      radius: '50%',
      data: [
        { value: 1048, name: 'Search Engine' },
        { value: 735, name: 'Direct' },
        { value: 580, name: 'Email' },
        { value: 484, name: 'Union Ads' },
        { value: 300, name: 'Video Ads' }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }
  ]
};

option && myChart.setOption(option);
