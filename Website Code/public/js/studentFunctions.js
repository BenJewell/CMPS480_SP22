function letterGrade(num){
    if(num >= 0.9){
        return "A";
    }
    else if(num >= 0.8){
        return "B";
    }
    else if(num >= 0.7){
        return "C";
    }
    else if(num >= 0.6){
        return "D";
    }
    else if(num < 0.6){
        return "F";
    }
    return "";
}
function toPercentage(num){
    return Math.round(num * 10000) / 100;
}
function checkNull(val){
    if(val == null){
        return "-";
    }
    return val;
}
function checkMissing(miss){
    var warning = feather.icons['alert-circle'].toSvg();
    if(miss){
        document.getElementById("missingTR").style = "background-color: hsla(0, 100%, 50%, 0.3)";
        document.getElementById("missingTD").innerHTML = warning;

    }
    document.getElementById("missingTR").id = "TR";
    document.getElementById("missingTD").id = "TD";
}