

var myChart = echarts.init(document.getElementById('main-2'));

                    var option = {
                        title: {
                            text: 'Результати усіх питань',
                            left: 'center'
                        },
                        tooltip: {
                            trigger: 'item'
                        },

                        series: [
                            {
                            name: 'Access From',
                            type: 'pie',
                            radius: '50%',
                            data: [
                                { 
                                    value: 60,
                                    name: 'Правильно',
                                    itemStyle: {
                                        color: '#00E676'
                                    }
                                },
                                { 
                                    value: 40, 
                                    name: 'Неправильно',
                                    itemStyle: {
                                        color: '#FB1843'
                                    }
                                }
                            ],
                            emphasis: {
                                itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)',

                                }
                            }
                            }
                        ]
                        };

                        option && myChart.setOption(option);
