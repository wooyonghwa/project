$(document).ready(function (e) {
    //식단정보 가져오는 함수
    getMainMeals();
});

/*음식정보 가져오는 함수 */
function getMainMeals() {
    $.ajax({
        type: "GET",
        url: "/meals",
        data: {},
        success: function (response) {
            if(response['result']){
                let meal_list = response['meal_list'];
                $.each(meal_list,function(index,meal_list){
                    let recipientNums = meal_list.recipientNums;
                    let make_recipient="";
                    for(let i=0;i<recipientNums.length;i++){
                        make_recipient += (meal_list.recipientNames[i] + " " + recipientNums[i]+"개");
                        if(i != recipientNums.length-1){
                            make_recipient+=", ";
                        }
                    }
                    let result = makeMainMeals(index+1,make_recipient,meal_list);
                    $('#main_meal_list').append(result);
                });
                // 없는 경우 등록 페이지 이동 버튼
            }
        }
    });
}
function makeMainMeals(i,make_recipient,meal_list){
    let mealMainHtml = `<tr>
                            <th scope="row">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="gridCheck${i}">
                                    <label class="form-check-label" for="gridCheck${i}">
                                    </label>
                                </div>
                            </th>
                            <td>${make_recipient}</td>
                            <td class="meal_time">${meal_list.hour}:${meal_list.mins}</td>
                        </tr>`;
    return mealMainHtml;
}