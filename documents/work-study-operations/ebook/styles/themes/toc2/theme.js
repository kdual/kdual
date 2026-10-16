define(function (require, exports, module) {

    "use strict";

    var _$tbar, _$toc;
    var _$sidePreviousPage, _$sideNextPage;
    
    // --------------------------------------------------------------------//
    // --------------------------- 이벤트 ---------------------------------//
    // --------------------------------------------------------------------//
    // ----------------------------------------------------------------------
    // 페이지가 로드 되었을때 ...
    // ----------------------------------------------------------------------
    Toast.on(Toast.Events.PAGE_DID_LOAD, function(page) {});

    // ----------------------------------------------------------------------
    // 페이지가 언로드 되었을때 ...
    // ----------------------------------------------------------------------
    Toast.on(Toast.Events.PAGE_DID_UNLOAD, function(page) {});

    // ----------------------------------------------------------------------
    // 페이지가 변경 될 때 ...
    // ----------------------------------------------------------------------
    Toast.on(Toast.Events.WILL_MOVE_PAGE, function(page, totalPage) {
        if (Toast.isMobileDevice) return;
        _updateTocLayout();
        _viewLayout();
    });
    
    // ----------------------------------------------------------------------
    // 페이지가 변경 되었을때 ...
    // ----------------------------------------------------------------------
    Toast.on(Toast.Events.PAGE_DID_CHANGE, function(page, totalPage) {});

    // ----------------------------------------------------------------------
    // 북마크 상태가 변경되었을때 ...
    // ----------------------------------------------------------------------
    Toast.on(Toast.Events.BOOKMARK_DID_CHANGE, function(bookmarks) {});
    
    // ----------------------------------------------------------------------
    // 확대/축소 상태가 변경되었을때 ...
    // ----------------------------------------------------------------------
    Toast.on(Toast.Events.ZOOM_MODE_DID_CHANGE, function(isOn) {
        if (Toast.isMobileDevice || isOn) return;
        _updateTocLayout();
        _viewLayout();
    });
    
    // ----------------------------------------------------------------------
    // 디바이스 방향 전환이 되었을때 ...
    // ----------------------------------------------------------------------
    Toast.on(Toast.Events.ORIENTATION_DID_CHANGE, function(orientation) {});

    // ----------------------------------------------------------------------
    // 양면.단면 페이지 전환시 ...
    // ----------------------------------------------------------------------
    Toast.on(Toast.Events.DOUBLEPAGE_DID_CHANGE, function(doublepage) {
        if (Toast.isMobileDevice) return;
        _updateTocLayout();
        _viewLayout();
    });
    
    // --------------------------------------------------------------------//
    // ----------------------------- 테마 API -----------------------------//
    // --------------------------------------------------------------------//
    // ----------------------------------------------------------------------
    // 테마 로드/언로드
    // ----------------------------------------------------------------------
    
    exports.load = function(baseUrl) {

        _applyThemeConfig();
        
        if (Toast.isMobileDevice) return;
        
        _$tbar = Toast.$navbar.find('.btn-toolbar').not('.btn-small-toolbar');
        _$tbar.css('width', $('.book').width() + 'px');

        _$tbar.find('.btn-menubar-toggle').on('click', _toggleMenubar);

        
        var $navigateButtons = Toast.$el.find('.side-page-navigate-buttons');
        _$sidePreviousPage =  $navigateButtons.find('.btn-side-previous-page');
        _$sideNextPage =  $navigateButtons.find('.btn-side-next-page');

        _$toc = Toast.$el.find('.side-toc');
        $.ajax({
            type: "GET",
            url: Toast.paths.data + 'toclist.xml',
            dataType: "xml",
            success: function (data) {
                _loadTOC(data);
            }
        });

        _hideMenubar(false);

        $(window).on('resize', _onWindowResize);
    }
    exports.unload = function() {}
    exports.hasMobileStyleSheet = function() { return true;}

    // ----------------------------------------------------------------------
    // Private functions
    // ----------------------------------------------------------------------
    
    function _applyThemeConfig() {
        if (Toast.theme.config.backgroundColor) {
            Toast.$el.css('backgroundColor', Toast.theme.config.backgroundColor);
        }
    }

    function _loadTOC(data) {

        var $toclist = $('<ul />');
        var $tocXMLlist = $(data).find(":root");

        $tocXMLlist.children().each(function (index, toc) {
            var $toc = $(toc);            
            var $item = $('<li />');

            $item.append('<span>' + $toc.children('subject').text() +'</span>')

            if ($toc.attr('pageNo')) {
                $item.attr('data-page', $toc.attr('pageNo'));
            }
            $toclist.append($item);
        });

        var itemConfig = Toast.theme.config['side-toc'].itemConfig;
                
        if (itemConfig.textColor) {
            _$toc.css('color', itemConfig.textColor);
        }

        if (itemConfig.backgroundImage) {
            _$toc.css('backgroundImage', 'url(' + Toast.theme.baseURL + itemConfig.backgroundImage + ')');
        }
        if (itemConfig.backgroundColor) {
            _$toc.css('backgroundColor', itemConfig.backgroundColor);
        }

        var items = itemConfig['items'];
        _.each(Object.keys(items), function(key) {
            var index = Number(key);
            var $item = $toclist.children().eq(index);
            
            if (items[key].backgroundColor) {
                $item.css('backgroundColor', items[key].backgroundColor);    
            }
            
            if (items[key].textColor) {
                $item.css('color', items[key].textColor);    
            }

            if (items[key].icon) {
                $item.prepend('<img class="icon" src="' + Toast.theme.baseURL + items[key].icon +'">');
            }
            
            if (items[key].image) {
                $item.addClass('image-item');
                $item.empty();
                $item.append('<img src="' + Toast.theme.baseURL + items[key].image +'">');
            }
            
            if (items[key].width) {
                $item.css('width', items[key].width);
            }
            
            if (items[key].fontSize) {
                $item.css('fontSize', items[key].fontSize);
            }
        });

        _$toc.find('.side-toc-body').append($toclist);

        var tocWidth;
        var $navbarBrand = _$toc.find('.navbar-brand');
        if ($navbarBrand.find('img').length) {
            tocWidth = $navbarBrand.width();
        } else {
            tocWidth = Math.min(200, $toclist.width() + 10);
        }
        _$toc.css('width', tocWidth);
        
        $toclist.children('li').on('click', _tocItemClicked);

        Toast.$bookContainer.css('right', tocWidth);

        var toolbarMarginLeft = (Toast.$el.width() - Toast.$bookContainer.width()) / 2;
        toolbarMarginLeft -= Toast.$bookContainer.offset().left;

        Toast.$navbar.find('.btn-toolbar')
        .not('.btn-small-toolbar')
        .css('marginLeft', -(toolbarMarginLeft));

        Toast.Book.layout();

        _viewLayout();
    }

    function _tocItemClicked(event) {
        var $target = $(event.currentTarget);
        var page = $target.attr('data-page');
        if (page) {
            Toast.api.gotoPage(page);
        }
    }

    function _setTopButtonBalance() {

        var $leftBtnGroup = _$tbar.find('.left-btn-group');
        var $rightBtnGroup = _$tbar.find('.right-btn-group');
        var leftBtnCount = $leftBtnGroup.children('.btn:visible').length;
        var rightBtnCount = $rightBtnGroup.children('.btn:visible').length;
        var $noEventBtn = $('<button />', { 'class': 'btn btn-balance no-events', 'command': '__' });

        if (leftBtnCount>rightBtnCount)  {
            for (var i = 0; i < leftBtnCount - rightBtnCount; i++) {
                $rightBtnGroup.append($noEventBtn.clone());
            }
        } else {
            for (var i = 0; i < rightBtnCount - leftBtnCount; i++) {
                $leftBtnGroup.prepend($noEventBtn.clone());
            }
        }
    }

    function _toggleMenubar() {
        if (Toast.$navbar.hasClass('hide-menubar')) {
            _showMenubar(true);
        } else {
            _hideMenubar(true);
        }
    }

    function _showMenubar(animated) {
        Toast.$navbar.animate({ top: 0, }, animated ? 150 : 0, function() {
            Toast.$navbar.removeClass('hide-menubar');
        });
    }

    function _hideMenubar(animated) {
        Toast.$navbar.animate({ top: -Toast.$navbar.height(), }, animated ? 150 : 0, function() {
            Toast.$navbar.addClass('hide-menubar');
        });
    }
    
    function _viewLayout() {
        var $book = Toast.$book;
        if(!Toast.isMobileDevice) {
            var w = $book.width();
            _$tbar.css('width', w + 'px');
        } else {
            _$tbar.css('width', '100%');
        }

        _updateTocLayout();

        var bookRect = $book.get(0).getBoundingClientRect();
        _$sidePreviousPage.css({
            'left': $book.position().left - _$sidePreviousPage.width() + Toast.$bookContainer.offset().left,
            'top': bookRect.bottom - _$sidePreviousPage.height()
        });
        
        _$sideNextPage.css({
            'left': $book.position().left + $book.width() + Toast.$bookContainer.offset().left,
            'top': bookRect.bottom - _$sideNextPage.height()
        });
    }

    function _updateTocLayout() {

        var $book = Toast.$book;
        var left = parseInt($book.css('left'));
        var top = parseInt($book.css('top'));
        
        if (Toast.$el.hasClass('back-cover')) {
            left = left + ($book.width() / 2);
        } else {
            left = left + $book.width();
        }

        _$toc.css({
            'left': left,
            'top': top,
            'height': $book.height()
        });
    }

    function _onWindowResize(event) {
        Toast.lazy(function(){
            _viewLayout();
        }, 5);
    }

    // ----------------------------------------------------------------------
    // 토스트가 준비 완료됨 ...
    // ----------------------------------------------------------------------
    Toast.ready(function() {
        if (Toast.isMobileDevice) return;

        _setTopButtonBalance();
        
        var $navbarBrand = _$toc.find('.navbar-brand');
        if (!$navbarBrand.find('img').length) {
            _$toc.find('.side-toc-header').hide();
            _$toc.find('.side-toc-body').css({
                'top': 50
            })
        }

        _viewLayout();
    });
});