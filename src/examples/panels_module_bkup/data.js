
                    //const element = document.querySelector(`[id^="data_test"]`);
                    
                    
                  
                    //console.log(typeof(element))
                    
                    //console.log(document.querySelector('#data_test'))
                    console.log(document.getElementById("data_test").innerText)

                  var options = {
                    chart: {
                      height: 100,
                      width: "100%",
                      type: "line"
                      },

                    colors: ["FFFFFF"],

                    stroke: {
                    width: 1},

                  series: [
                    {
                      name: "Series 1",
                      data: [[1, 34], [3.8, 43], [5, 31] , [10, 43], [13, 33], [15, 43], [18, 33] , [20, 52]]
                    }
                    ],
                  xaxis: {
                    type: 'numeric'
                          },
                  tooltip: {
                      x: {
                      formatter: function(val) {
                      return val.toFixed(1);
                    }
                  }
                }
              };

            
              var chart = new ApexCharts(document.querySelector("#chart"), options);

              chart.render();

