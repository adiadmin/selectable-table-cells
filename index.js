'use strict';
angular.module('adidas.selectableTableCells', []);

angular.module('adidas.selectableTableCells')
	.directive('selectableTableCells', ['$document','$window', function ($document, $window) {
		return {
			link: function (scope, element, attr) {
                // Init's at the bottom

                var SELECTION_START = 0;
                var SELECTION_END = 1;
                var tableCreated = false;
                var headerSelected = false;

                var selection = [getCellPos(), getCellPos()];

                var tbl = element;
                element.addClass('selectableTableCells');

                function startSelection(event) {
                    if (event.button === 2) { return false; }
                    
                    clearSelectionBorders();
                    if (this !== tbl.find('td.highlighted').last()[0]) {
                        setSelection(this, SELECTION_START);
                    }
                    setSelection(this, SELECTION_END);

                    tbl.find("td").mouseenter(moveSelection);
                }

                function stopSelection() {
                    applySelectionHighlight();
                    applySelectionBorders();

                    tbl.find("td").off('mouseenter');
                }

                function moveSelection() {
                    setSelection(this, SELECTION_END);
                }

                function setSelection(element, position) {
                    element = $(element);
                    var cellPos = getCellPos(element);
                    selection[position] = cellPos;
                    applySelectionHighlight();
                    createInvisibleTable();
                }

                function getCellPos(element) {
                    element = $(element);
                    if (element.length) return {
                        col: element.index(),
                        row: element.parent().parent().is(tbl.find('tr:first-child')) ? 0 : element.parent().index()
                    };
                    return {
                        row: -1,
                        col: -1
                    };
                }

                function getSelectionRect() {
                    var rect = {
                        x: 0,
                        y: 0,
                        width: 0,
                        height: 0
                    };

                    rect.x = Math.min(selection[SELECTION_START].col, selection[SELECTION_END].col);
                    rect.y = Math.min(selection[SELECTION_START].row, selection[SELECTION_END].row);
                    rect.width = Math.max(selection[SELECTION_START].col, selection[SELECTION_END].col) + 1;
                    rect.height = Math.max(selection[SELECTION_START].row, selection[SELECTION_END].row) + 1;

                    // disabled the selection of the entire first row when the user clicks on the first column cells
                    //if (rect.x === 0 && rect.width === 1) rect.width = tbl.find('tr:first-child > *').length;
                    if (rect.y === 0 && rect.height === 1) {
                    rect.height = tbl.find('tr').length;
                    headerSelected = true;
                    }

                    return rect;
                }

                function applySelectionHighlight() {
                    clearSelectionHighlight();

                    var selectionRect = getSelectionRect();

                    tbl.find('td').slice(selectionRect.x, selectionRect.width).addClass('highlighted');
                    tbl.find('tr').slice(selectionRect.y, selectionRect.height).each(function () {
                        // Removed this since th is not being used
                        //$(this).find('> th:first-child').addClass('highlighted');
                        $(this).find('> *').slice(selectionRect.x, selectionRect.width).addClass('highlighted');
                    });
                }

                function clearSelectionHighlight() {
                    tbl.find('td').removeClass('highlighted');
                }

                function applySelectionBorders() {
                    var allHighlighted = tbl.find('.highlighted');
                    allHighlighted.each(function (i, item) {
                        var index = $(item).index();
                        var b = tbl.find("td.highlighted:last").addClass("autofill-cover");
                        if (!$(item).prev().is('td.highlighted')) {
                            $(item).addClass('left');
                        }
                        if (!$(item).next().is('td.highlighted')) {
                            $(item).addClass('right');
                        }
                        if (!$(item).closest('tr').prev().find('td:nth-child(' + (index + 1) + ')').hasClass('highlighted')) {
                            $(item).addClass('top');
                        }
                        if (!$(item).closest('tr').next().find('td:nth-child(' + (index + 1) + ')').hasClass('highlighted')) {
                            $(item).addClass('bottom');
                        }
                    });
                }

                function clearSelectionBorders() {
                    tbl.find('td').removeClass('top bottom left right');
                }

                function clearAll() {
                    selection = [getCellPos(), getCellPos()];
                    clearSelectionHighlight()
                    clearSelectionBorders();
                }

                function selectElementContents(el) {
                    var body = document.body, range, sel;
                    if (document.createRange && $window.getSelection) {
                        range = document.createRange();
                        sel = $window.getSelection();
                        sel.removeAllRanges();
                        try {
                            range.selectNodeContents(el);
                            sel.addRange(range);
                        } catch (e) {
                            range.selectNode(el);
                            sel.addRange(range);
                        }
                    } else if (body.createTextRange) {
                        range = body.createTextRange();
                        range.moveToElementText(el);
                        range.select();
                    }
                }

                function createInvisibleTable() {
                    var selectionRect = getSelectionRect();
                    var headers = [];
                    var contents = [];
                    var rowCounter = 2;

                    if (tableCreated) {
                        $("#hiddenTable td").html("<table id='theHiddenTable' cellspacing='0' cellpadding='0' border='0'><tr></tr></table>");
                    } else {
                        tbl.append("<tr id='hiddenTable'><td><table id='theHiddenTable' cellspacing='0' cellpadding='0' border='0'><tr></tr></table></td></tr>");
                        tableCreated = true;
                    }

                    // build header row
                    tbl.find('td').slice(selectionRect.x, selectionRect.width).each(function(index) {
                        var display = $(this)[0].currentStyle ? $(this)[0].currentStyle.display : getComputedStyle($(this)[0], null).display;
                        if (display !== 'none') {
                        //headers[index] = $(this)[0].outerText;
                        $("#hiddenTable table tr:first-child").append("<th>" + $(this)[0].outerText + "</th>");
                        }
                    });
                    
                    // builds rest of the rows
                    tbl.find('tr').slice(selectionRect.y, selectionRect.height).each(function (i) {
                        console.log($(this).attr("id"));
                        if( $(this).attr("id") == "hiddenTable" ) return false;

                        var row = [];
                        $("#hiddenTable table").append("<tr></tr>");
                        
                        // checks to see if header is selected and won't copy it as the first row
                        if (headerSelected == true) {
                            rowCounter++;
                            headerSelected = false;
                            return true;
                        }
                        
                        $(this).find('> *').slice(selectionRect.x, selectionRect.width).each(function(index){
                            var display = $(this)[0].currentStyle ? $(this)[0].currentStyle.display : getComputedStyle($(this)[0], null).display;
                            if (display !== 'none') {
                                //row[index] = $(this)[0].outerText;
                                $("#hiddenTable table tr:nth-child("+rowCounter+")").append("<td>" + $(this)[0].outerText + "</td>");
                            }
                        });
                        rowCounter++;
                        //contents[i] = row;
                    });
                }

                // Initialize selectable table cells by attaching event listeners to all
                // TD's in the table element.
                tbl.on('mousedown', 'td', startSelection);
                $(window).mouseup(stopSelection);

                // Attaches an event listener to clear selection on each new mousedown
                $(window).mousedown(function (event) {
                    var isTable = false;
                    var parents = $(event.target).parents();
                    
                    for (var i = 0; i < parents.length; i++) {
                        if (parents[i].className.indexOf('selectableTableCells') != -1) isTable = true;
                    }

                    if (!isTable) clearAll();
                    
                });

                // Attaches an event listener to create a hidden table and populate it with the selected data.
                // This allows the user to copy the selected cells to their clipboard and paste it wherever they wish :)
                $document.keydown(function(e){
                    if (e.which == 17 || e.which == 91) {
                        selectElementContents( document.getElementById('theHiddenTable') );
                    }
                });

			}
        }
    }]);