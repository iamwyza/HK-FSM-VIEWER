// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

$(document).ready(function () {



    var infohead = document.getElementById("info_head");
    var info_transitions = document.getElementById("info_transitions");
    var info_actions = document.getElementById("info_actions");
    var info_parameters = document.getElementById("info_parameters");

    var fsm;

    var mySVG = document.getElementById("svg");
    mySVG.setAttribute("width", window.innerWidth);
    mySVG.setAttribute("height", window.innerHeight);

    function getMethod(method) {
        ret = method.split(".");
        return "<span class='function'>" + ret[ret.length - 1] + "</span>";
    }

    function getString(str_params, str_read) {
        if (str_params[str_read].useVariable) {
            return "<span class='variable'>" + str_params[str_read].name + "</span>";
        } else {
            return "<span class='literal'>" + str_params[str_read].value + "</span>";
        }
    }

    function byteArrayToBool(byteArray) {
        return "<span class='bool'>" + (byteArray[0] > 0).toString().toUpperCase() + "</span>";
    }

    function byteArrayToFloat(byteArray) {
        byteArray = byteArray.reverse()
        var buf = new ArrayBuffer(byteArray.length);
        var view = new DataView(buf);

        byteArray.forEach(function (b, i) {
            view.setUint8(i, b);
        });

        var value = view.getFloat32(0);
        return "<span class='literal'>" + value + "</span>";
    };

    function byteArrayToLong(byteArray) {
        var value = 0;
        for (var i = byteArray.length - 1; i >= 0; i--) {
            value = (value * 256) + byteArray[i];
        }

        return "<span class='literal'>" + value + "</span>";
    };

    function getEventTargets(eventTargets, paramIndex, eventIndex) {
        //    console.log(eventTargets)
        //    console.log(eventIndex)
        //    console.log(eventTargets[eventIndex] )
        if (eventTargets[eventIndex]["target"] == 0) {
            return "<span class='bool'>SELF</span>";
        } else {
            return "<span class='bool'>NULL</span>";
        }
    }

    function getParentGameObject(gameObjects, index, param) {
        if (gameObjects != undefined
            && gameObjects[index] != undefined
            && typeof gameObjects[index] === "object"
            && "ownerOption" in gameObjects[index]
            && gameObjects[index].ownerOption == 1) {
            return "<span class='literal'>" + gameObjects[index].gameObject.name + "</span>"
        } else {
            return "<span class='bool'>NULL</span>"
        }
    }

    function getGameObject(gameObjects, index, param) {
        return "<span class='literal'>" + gameObjects[index].name + "</span>"
    }

    function getAsciiString(byteArray, start, length) {
        var value = ""
        var variable = false

        while (byteArray[start] == 0) {
            start++
            length--;
        }
        if (byteArray[start] == 1) {
            start++
            length--
            variable = true
        }
        //console.log(byteArray.slice(start, start+length))
        for (var i = start; i < start + length; i++) {
            value += String.fromCharCode(byteArray[i])
        }
        //console.log(value)
        if (variable) {
            return "<span class='variable'>" + value + "</span>";
        } else {
            return "<span class='literal'>" + value + "</span>";
        }
    }

    function updateInfo(str) {

        infohead.innerHTML = str;
        var fsm = FindState(str);

        var string = "";
        var actionNames = fsm.actionData.actionNames;
        var str_params = fsm.actionData.fsmStringParams;

        var eventTargets = fsm.actionData.fsmEventTargetParams;

        var gameObjects = fsm.actionData.fsmGameObjectParams;
        var childObjects = fsm.actionData.fsmOwnerDefaultParams;

        var byteData = fsm.actionData.byteData
        var paramDataType = fsm.actionData.paramDataType;
        var paramName = fsm.actionData.paramName;
        var paramDataPos = fsm.actionData.paramDataPos;
        var paramByteDataSize = fsm.actionData.paramByteDataSize;

        var arraySizeParam = fsm.actionData.arrayParamSizes;

        var array_read = 0;
        var child_read = 0;
        var go_read = 0;
        var events_read = 0;
        var param_read = 0;
        var str_read = 0;

        for (var i = 0; i < actionNames.length; i++) {
            if (i < actionNames.length - 1) {
                params = fsm.actionData.actionStartIndex[i + 1] - fsm.actionData.actionStartIndex[i]
                //          console.log(params)
            } else {
                params = fsm.actionData.paramDataPos.length - fsm.actionData.actionStartIndex[i]
                //          console.log(params)
            }

            string += getMethod(actionNames[i])
            string += "("

            for (var j = 0; j < params; j++) {
                switch (paramDataType[param_read]) {
                    case 1:
                        string += byteArrayToBool(byteData.slice(paramDataPos[param_read], paramDataPos[param_read] + paramByteDataSize[param_read]))
                        param_read++;
                        break;
                    case 15:
                        string += getAsciiString(byteData, paramDataPos[param_read], paramByteDataSize[param_read]);
                        //string += byteArrayToFloat( byteData.slice(paramDataPos[param_read], paramDataPos[param_read]+paramByteDataSize[param_read]) )
                        param_read++;
                        break;
                    case 16:
                        if (byteData[paramDataPos[param_read] + paramByteDataSize[param_read] - 1] == 0) {
                            string += byteArrayToLong(byteData.slice(paramDataPos[param_read], paramDataPos[param_read] + paramByteDataSize[param_read]))
                        } else {
                            string += getAsciiString(byteData, paramDataPos[param_read], paramByteDataSize[param_read]);
                        }
                        //string += byteArrayToFloat( byteData.slice(paramDataPos[param_read], paramDataPos[param_read]+paramByteDataSize[param_read]) )
                        param_read++;
                        break;
                    case 17:
                        string += getAsciiString(byteData, paramDataPos[param_read], paramByteDataSize[param_read]);
                        param_read++;
                        break;
                    case 18:
                        if (paramByteDataSize[param_read] == 0) {
                            string += getString(str_params, str_read);
                            str_read++;
                        }
                        else {
                            string += getAsciiString(byteData, paramDataPos[param_read], paramByteDataSize[param_read]);
                        }
                        param_read++;
                        break;
                    case 20:
                        string += getParentGameObject(byteData, paramDataPos[param_read], paramByteDataSize[param_read]);
                        param_read++
                        break;
                    case 23:
                        string += getAsciiString(byteData, paramDataPos[param_read], paramByteDataSize[param_read]);
                        param_read++
                        break;
                    case 28:
                        string += getAsciiString(byteData, paramDataPos[param_read], paramByteDataSize[param_read]);
                        //string += byteArrayToFloat( byteData.slice(paramDataPos[param_read], paramDataPos[param_read]+paramByteDataSize[param_read]) )
                        param_read++;
                        break;
                    default:
                        string += byteArrayToLong(byteData.slice(paramDataPos[param_read], paramDataPos[param_read] + paramByteDataSize[param_read]))
                        param_read++;
                        break;
                }
                string += ","
            }
            string = string.substring(0, string.length - 1);
            string += ")</br>"



        }
        info_actions.innerHTML = string;
        var transitions_string = ""
        for (var i = 0; i < fsm.transitions.length; i++) {
            transitions_string += fsm.transitions[i].fsmEvent.name;
            transitions_string += " => ";
            transitions_string += fsm.transitions[i].toState;
            transitions_string += "</br>";
        }

        info_transitions.innerHTML = transitions_string

        var extra_str_param = ""
        for (str_read; str_read < str_params.length; str_read++) {
            extra_str_param += str_params[str_read].value + "</br>";
        }
        var extra_params = ""
        for (param_read; param_read < paramName.length; param_read++) {
            extra_params += paramName[param_read] + " | " + paramDataPos[param_read] + "|" + paramByteDataSize[param_read] + "|" + paramDataType[param_read] + "</br>";

            extra_params += byteArrayToLong(byteData.slice(paramDataPos[param_read], paramDataPos[param_read] + paramByteDataSize[param_read])) + "</br>"

        }
        info_parameters.innerHTML = extra_str_param + extra_params;

    }

    function FindState(str) {
        var arr = fsm.states;
        for (var i = 0; i < arr.length; i++) {
            var obj = arr[i];
            if (obj.name == str) {
                return obj;
            }
        }
    }

    function createDiv(x, y, w, h, c, text) {
        var div = document.createElement("div");
        $("#viewer").append(div);

        div.style.left = x + "px";
        div.style.top = y + "px";
        div.style.width = w + "px";
        div.style.height = h + "px";
        div.className = c;

        div.onmouseover = function () { updateInfo(text) };

        div.innerHTML = text;
    }

    function createLine(x, y, x2, y2, c, s) {
        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x);
        line.setAttribute("x2", x2);
        line.setAttribute("y1", y);
        line.setAttribute("y2", y2);
        line.style.stroke = c;
        line.style.strokeWidth = s;
        svg.appendChild(line);
    }
    var directoryName;

    var directory;

    function selectDirectory() {
        $("#files").prop("disabled", true);
        var folderPicker = new Windows.Storage.Pickers.FolderPicker();
        folderPicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId;
        folderPicker.fileTypeFilter.replaceAll([".json"]);

        folderPicker.pickSingleFolderAsync().then(loadFiles);
    }

    function loadFiles(folder) {
        console.log("Loading Files");
        if (folder) {
            // Application now has read/write access to all contents in the picked folder
            // (including other sub-folder contents)
            if (!Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.containsItem(folder))
                Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.add(folder);
            Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.addOrReplace("PickedFolderToken", folder);

            directoryName = folder.path;
            directory = folder;
            $("#currentDirectory").html(directoryName);

            var oldplaceholder = $('#files').attr('placeholder');
            $('#files').attr('placeholder', 'Loading...');

            folder.getFilesAsync().done(function (files) {
                var fileList = [];
                $.each(files,
                    function (index, file) {
                        if (!file.name.endsWith("json")) return;
                        fileList.push(file.name);
                    });
                $("#files").autocomplete({
                    source: fileList,
                    minLength: 4,
                    select: function (event, ui) {
                        loadFile(ui.item.value);
                        $("#files").blur();
                    }
                });
                $("#files").prop("disabled", false);
                $('#files').prop('placeholder', oldplaceholder);
            });
        }
    }




    function loadFile(fileName) {
        var svg = $("#svg");
        svg.empty();
        $("#viewer").css({
            'left': $("#viewer").data("originalLeft"),
            'top': $("#viewer").data("origionalTop")
        });
        $(".fsmBox").remove();
        
        directory.tryGetItemAsync(fileName).done(function (file) {
            Windows.Storage.FileIO.readTextAsync(file).done(function (data) {
                fsm = JSON.parse(data);
                var arr = fsm.states;
                for (var i = 0; i < arr.length; i++) {
                    var obj = arr[i]
                    createDiv(obj.position.x, obj.position.y, obj.position.width, obj.position.height, "fsmBox", obj.name);

                    var arr2 = obj.transitions;
                    for (var j = 0; j < arr2.length; j++) {
                        obj2 = arr2[j];
                        var toState = obj2.toState;
                        var fsm_toState = FindState(toState);

                        if (fsm_toState != null) {
                            createLine(obj.position.x + (obj.position.width / 2),
                                obj.position.y + (obj.position.height / 2),
                                fsm_toState.position.x + (fsm_toState.position.width / 2),
                                fsm_toState.position.y + (fsm_toState.position.height / 2),
                                "#F00",
                                "2px");


                        }

                    }
                }


            });
            return;
        });


    }

    $("#files").on("focus", function () {
        $("#files").val("");
    });
    $("#btnDirSelect").on("click", function () {
        selectDirectory();
    });

    if (Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.length > 0) {
        Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList
            .getFolderAsync(Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries[0].token)
            .done(loadFiles);
    }

    $("#viewer").data({
        'originalLeft': $("#viewer").css("left"),
        'origionalTop': $("#viewer").css("top")
    });

    $('#viewer').draggable({
        zIndex: 0,
        scroll: false
    });
   // svgPanZoom("#svg");
    var test = Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
    //loadFiles();
});