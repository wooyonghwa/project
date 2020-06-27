$(document).ready(function (e) {
    $.ajax({
        type: "GET",
        url: "/meals/date",
        data: {},
        success: function (response) {
            if (response['result']) {
                let date_list = response['date_list'];
                for (let i = 0; i < date_list.length; i++) {
                    let date_sentence = `<option value="${date_list[i]}">${date_list[i]}</option>`;
                    $('#meal_select').append(date_sentence);
                }
            }
        }
    });

    $.ajax({
        type: "GET",
        url: "/exercise/date",
        data: {},
        success: function (response) {
            if (response['result']) {
                let exer_list = response['exer_list'];
                for (let i = 0; i < exer_list.length; i++) {
                    let date_sentence = `<option value="${exer_list[i]}">${exer_list[i]}</option>`;
                    $('#exer_select').append(date_sentence);
                }
            }
        }
    });

    $('#lookup-reg-meals').click(function (e) {
        //시간과 숫자 초기화 함수
        initNumbers();
        $('#add-meal-btn').show();
        $('#chg-meal-btn').hide();
        let mealListCnt = $('#search_meal_list')[0].childElementCount;
        if (mealListCnt >= 10) {
            alert('식단은 최대 10개까지 등록 가능합니다.');
            location.reload();
            return;
        }
    });

    $('#lookup-reg-meals').one('click', function (e) {
        getFoods();
    });
});
//운동 조회 function
function lookupPastExer(obj){
    let date = obj.value;
    
    if (date != 0) {
        
        $.ajax({
            type: "GET",
            url: "/exercise/list/date",
            data: {
                "date": date
            },
            success: function (response) {
                if (response['result']) {
                    let exercise_list = response['exercise_list'];
                    $.each(exercise_list, function (index, exercise_list) {
                        for(let i = 0;i<exercise_list.checkArray.length;i++){
                            if(exercise_list.checkArray[i]=="true"){
                                $('#past-img-exercise'+(i+1)).css('display','block');
                            }else{
                                $('#past-img-exercise'+(i+1)).css('display','none');
                            }
                        }
                    });
                }
            }
        });
    } else {
        $('img[id^=past-img-exercise').css('display','none');
    }
}

function lookupPastMeal(obj) {
    let date = obj.value;

    if (date != 0) {
        let dateArray = date.split('/');
        $.ajax({
            type: "GET",
            url: "/meals/list/date",
            data: {
                "year": dateArray[0],
                "month": dateArray[1],
                "day": dateArray[2]
            },
            success: function (response) {
                if (response['result']) {
                    let meal_list = response['meal_list'];
                    $('#search_meal_list').empty();
                    $.each(meal_list, function (index, meal_list) {
                        let recipientNums = meal_list.recipientNums;
                        let make_recipient = "";
                        for (let i = 0; i < recipientNums.length; i++) {
                            make_recipient += (meal_list.recipientNames[i] + " " + recipientNums[i] + "개");
                            if (i != recipientNums.length - 1) {
                                make_recipient += ", ";
                            }
                        }
                        let result = makeMealsForLookupChange(index + 1, make_recipient, meal_list);
                        $('#search_meal_list').append(result);
                    });
                    $('#lookup-reg-meals').show();
                } else {
                    alert(response['msg']);
                    return;
                }
            }
        });
    } else {
        $('#search_meal_list').empty();
        $('#lookup-reg-meals').hide();
    }
}


function makeMealsForLookupChange(i, make_recipient, meal_list) {
    let mealHtml = `
                    <tr>
                        <th scope="row">
                            ${i}
                        </th>
                        <td>${make_recipient}</td>
                        <td class="meal_time">${meal_list.hour}:${meal_list.mins}
                        <button type="button" style="margin-left:30px" class="btn btn-primary" id="lookup-change-meals" data-toggle="modal" data-target="#ModalReg" onclick="changeFood('${meal_list.date}','${meal_list.hour}','${meal_list.mins}')">변경</button>
                        <button type="button" style="margin-left:30px" class="btn btn-danger" onclick="delFood('${meal_list.date}','${meal_list.hour}','${meal_list.mins}')">삭제</button>
                        </td>
                    </tr>`;
    return mealHtml;
}



function reDrawPastMeal(obj) {
    let date = obj;

    let dateArray = date.split('/');
    $.ajax({
        type: "GET",
        url: "/meals/list/date",
        data: {
            "year": dateArray[0],
            "month": dateArray[1],
            "day": dateArray[2]
        },
        success: function (response) {
            if (response['result']) {
                let meal_list = response['meal_list'];
                if($('#search_meal_list').length > 0){
                    $('#search_meal_list').empty();
                }
                else if($('#meal_list').length > 0){
                    $('#meal_list').empty();
                }
                
                $.each(meal_list, function (index, meal_list) {
                    let recipientNums = meal_list.recipientNums;
                    let make_recipient = "";
                    for (let i = 0; i < recipientNums.length; i++) {
                        make_recipient += (meal_list.recipientNames[i] + " " + recipientNums[i] + "개");
                        if (i != recipientNums.length - 1) {
                            make_recipient += ", ";
                        }
                    }
                    if($('#search_meal_list').length > 0){
                        let result = makeMealsForLookupChange(index + 1, make_recipient, meal_list);
                        $('#search_meal_list').append(result);
                    }
                    else if($('#meal_list').length > 0){
                        let result = makeMeals(index + 1, make_recipient, meal_list);
                        $('#meal_list').append(result);
                    }
                });
            } else {
                location.reload();
                return false;
            }
        }
    });
}