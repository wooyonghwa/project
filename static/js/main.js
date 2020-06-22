$(document).ready(function (e) {
    //식단정보 가져오는 함수
    getMainMeals();
    getMainExercises();
    setTimeout(timeout, 300);
});

function timeout(){ 
    let storage = localStorage;
    let checkedCnt = 0;
    for(let i=0;i<storage.length;i++){
        // console.log($('#'+storage.key(i)));
        if(storage.getItem(storage.key(i))=="true"){
            $('#'+storage.key(i)).prop('checked',true);
            checkedCnt++;
        }
    }
    /* 식단 달성률 작성을 위한 식단 전체 개수 cnt */
    let totalLength = $('#main_meal_list tr').length;
    if(totalLength == 0){
        $('#meal-object').hide();
    }else{
        let applyVal = ((checkedCnt/totalLength) * 100).toFixed(0);
        $('#meal-object').text(applyVal+"%");
        $('#meal-object').css('width',applyVal+"%");
        $('#meal-object').attr('aria-valuenow',applyVal);
    }
    
    /*단백질 목표량 */
    makeObjective();
}
function makeObjective(){
    $.ajax({
        type: "GET",
        url: "/foods",
        data: {},
        success: function (response) {
            if(response['result']){
                let foodInfoList = response['food_list'];
                let foodLists = $('td[id^=mainCheck]');
                //오늘 먹어야 할 단백질 양
                let total_protein_amount = 0;
                //이미 먹은 단백질 양
                let eaten_protein_amount = 0;
                foodLists.each(function(index,item){
                    let foodList = $(item).text().split(',');
                    let checkBoxList = $('input[id=mainCheck'+(index+1)+']');
                    for(let i=0;i<foodList.length;i++){
                        let list = foodList[i].trim().split(' ');
                        for(let j=0;j<foodInfoList.length;j++){
                            if(foodInfoList[j].name == list[0]){
                                total_protein_amount += (foodInfoList[j].protein * list[1].split('')[0]);
                                if(checkBoxList.is(':checked')){
                                    eaten_protein_amount += (foodInfoList[j].protein * list[1].split('')[0]);
                                }
                            }
                        }
                    }
                });
                //console.log('total amount : '+total_protein_amount+' '+'eaten amount : '+eaten_protein_amount); 
                let applyVal = ((eaten_protein_amount/total_protein_amount) * 100).toFixed(0);
                $('#today_total_protein').text(total_protein_amount+'g');
                $('#protein-object').text(eaten_protein_amount+"g");
                $('#protein-object').css('width',applyVal+"%");
                $('#protein-object').attr('aria-valuenow',applyVal);
                
            }
        }
    });
}

/*음식정보 가져오는 함수 */
function getMainMeals() {
    $.ajax({
        type: "GET",
        url: "/meals/list",
        data: {},
        success: function (response) {
            if (response['result']) {
                let meal_list = response['meal_list'];
                $.each(meal_list, function (index, meal_list) {
                    let recipientNums = meal_list.recipientNums;
                    let make_recipient = "";
                    for (let i = 0; i < recipientNums.length; i++) {
                        make_recipient += (meal_list.recipientNames[i] + " " + recipientNums[i] + "개");
                        if (i != recipientNums.length - 1) {
                            make_recipient += ", ";
                        }
                    }
                    let result = makeMainMeals(index + 1, make_recipient, meal_list);
                    $('#main_meal_list').append(result);
                });
            }else{
                $('#time_table').hide();
                $('#today_time').append(`<div class='reg-meal-btn'>
                <button type="button" onclick="location.href='/mypage'" class="btn btn-secondary">식단 등록하러 가기</button>
                </div>`)
                
            }
        }
    });
}
function makeMainMeals(i, make_recipient, meal_list) {
    let mealMainHtml = `<tr>
                            <th scope="row">
                                <div class="form-check">
                                    <input class="form-check-input mainCheck${i}" type="checkbox" onclick="mainMealCheck(this)" id="mainCheck${i}">
                                    <label class="form-check-label" for="mainCheck${i}">
                                    </label>
                                </div>
                            </th>
                            <td id="mainCheck${i}">${make_recipient}</td>
                            <td class="meal_time">${meal_list.hour}:${meal_list.mins}</td>
                        </tr>`;
    return mealMainHtml;
}
/*운동정보 가져오는 함수 */
function getMainExercises() {
    $.ajax({
        type: "GET",
        url: "/exercise",
        data: {},
        success: function (response) {
            
            if (response['result']) {
                let exercise_list = response['exercise_list'][0].checkArray;
                $.each(exercise_list, function (index, exercise) {
                    if (exercise == "true") {
                        $('#img-exercise' + (index + 1)).show();
                    }
                });
            } else {
                $('#today_ex_list').append(`<div class='reg-exer-btn'>
                <button type="button" onclick="location.href='/mypage'" class="btn btn-secondary">운동 등록하러 가기</button>
                </div>`);
            }
        }
    });
}
function mainMealCheck(obj) {
    let storage = localStorage;
    if (obj.checked) {
        /* check box가 체크된 경우 localStorage에 저장함 */   
        storage.setItem($(obj).attr('id'), true);
    } else {
        storage.removeItem($(obj).attr('id'));
    }
    timeout();
}