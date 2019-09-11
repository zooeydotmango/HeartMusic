//自定义事件，所有模块都与事件中心进行交互
var EventCenter = {
  on: function(type, handler){
    $(document).on(type, handler)
  },
  fire: function(type, data){
    $(document).trigger(type, data);
  }
}

// EventCenter.on('hello', function(e,data){
//   console.log(e, data)
// })
// EventCenter.fire('hello', '你好')

//footer的功能：页面加载时向服务器发送请求获取列表信息
//拼装成节点并放到页面上
//当用户点左右方向键，列表会横向滚动
//用户点击某个流派时向全局发送一个信号，让播放器做出相应操作

let footer = {
  init: function(){
    this.$element = $('.list-bar');
    this.$ul = this.$element.find('ul');
    this.$leftBtn = this.$element.find('.fa-arrow-left');
    this.$rightBtn = this.$element.find('.fa-arrow-right');
    this.$layout = this.$element.find('.layout');
    this.isToEnd = false;
    this.isToStart = true;
    this.bind();
    this.getData();
  },
  bind: function(){
    let _this = this;
    //点击向右按钮
    this.$rightBtn.on('click',function(){
    let liWidth = _this.$ul.find('li').outerWidth(true);
    let count = Math.floor(_this.$layout.width()/liWidth);
    console.log(liWidth,count)

    //当点击右箭头，ul元素向左移动count个li的距离，动画结束时判断是否到结尾
      if(!_this.isToEnd){
        _this.$ul.animate({
          left : `-=${count*liWidth}px`
        }, 400,function(){
          _this.isToStart = false;
          _this.$leftBtn.removeClass('disabled');
          if( parseInt(_this.$layout.width()) - parseInt(_this.$ul.css('left')) >= parseInt(_this.$ul.css('width'))){
            //跳出isToEnd的判断，此时到达列表尾部，向右按钮加disabled涙
            _this.isToEnd = true;
            _this.$rightBtn.addClass('disabled');
          }
        });
      }
    });
    //点击向左按钮
    this.$leftBtn.on('click',function(){
      let liWidth = _this.$ul.find('li').outerWidth(true);
      let count = Math.floor(_this.$layout.width()/liWidth);
      console.log(liWidth,count)
      //当点击右箭头，ul元素向右移动count个li的距离，动画结束时判断是否到开头
        if(!_this.isToStart){
          _this.$ul.animate({
            left : `+=${count*liWidth}px`
          }, 400,function(){
            _this.isToEnd = false;
            _this.$rightBtn.removeClass('disabled');
            if(parseInt(_this.$ul.css('left')) >= 0){
              //跳出isToStart的判断，此时到达列表尾部，向左按钮加disabled涙
              _this.isToStart = true;
              _this.$leftBtn.addClass('disabled');
            }
          });
        }
      });

      //点击li时，发出select事件，并发出当前id
      this.$element.on('click','li',function(){
        $(this).addClass('active')
        .siblings().removeClass('active');

        EventCenter.fire('select-album', $(this).attr('data-channel-id'));
      })
  },
  getData: function(){
    let _this = this;
    $.getJSON('http://api.jirengu.com/fm/getChannels.php')
    .done(function(ret){
      _this.render(ret.channels);
      _this.setStyle();
    })
    .fail(function(){
      console.log('ajax error');
    })
  },
  render: function(channels){
    console.log(channels);
    let _this = this;
    channels.forEach(element => {
      let $node = $(`<li class="item" data-channel-id=${element.channel_id}>
      <div class="cover" style="background:center/cover url(${element.cover_small})"></div>
      <p>${element.name}</p></li>`);
      $node.appendTo(_this.$ul);
    });
  },
  setStyle: function(){
    let liNum = this.$ul.find('li').length;
    this.$ul.width(liNum *this.$ul.find('li').outerWidth(true));
  }
}
footer.init();

EventCenter.on('select-album',function(e,data){
  console.log('select '+data);
})

