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
                            data: [100, 50, 0, 100]
                        }
                        ]
                    };

                    myChart.setOption(option);