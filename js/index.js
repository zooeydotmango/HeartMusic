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
    this.isAnimate = false;
    this.bind();
    this.getData();
  },
  bind: function(){
    let _this = this;
    //点击向右按钮
    this.$rightBtn.on('click',function(){
    let liWidth = _this.$ul.find('li').outerWidth(true);
    let count = Math.floor(_this.$layout.width()/liWidth);
    if(_this.isAnimate){return}

    //当点击右箭头，ul元素向左移动count个li的距离，动画结束时判断是否到结尾
      if(!_this.isToEnd){
        _this.isAnimate = true;
        _this.$ul.animate({
          left : `-=${count*liWidth}px`
        }, 400,function(){
          _this.isToStart = false;
          _this.isAnimate = false;
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
      if(_this.isAnimate){return}
      let liWidth = _this.$ul.find('li').outerWidth(true);
      let count = Math.floor(_this.$layout.width()/liWidth);
      console.log(liWidth,count)
      //当点击右箭头，ul元素向右移动count个li的距离，动画结束时判断是否到开头
        if(!_this.isToStart){
          _this.isAnimate = true;
          _this.$ul.animate({
            left : `+=${count*liWidth}px`
          }, 400,function(){
            _this.isToEnd = false;
            _this.isAnimate = false;
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

        EventCenter.fire('select-album', {
          channelId:$(this).attr('data-channel-id'),
          channelName:$(this).attr('data-channel-name')
        });
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
      let $node = $(`<li class="item" data-channel-id=${element.channel_id} data-channel-name=${element.name}>
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

//fm功能
let fm = {
  init:function(){
    this.$cover = $('.cover');
    this.$info = $('.info');
    this.$play_pause = $('.btn-play');
    this.audio = new Audio();
    this.audio.autoplay = true;
    this.statusClock;
    this.bind();
  },
  bind:function(){
    let _this = this;
    //从footer触发的事件获得数据
    EventCenter.on('select-album',function(e,data){
      _this.channelId = data.channelId;
      _this.channelName = data.channelName;
      // console.log(_this.channelId,_this.channelName)
      _this.loadMusic();
    });
    //点击暂停播放按钮
    _this.$play_pause.on('click',function(){
      let $btn = $(this);
      if($btn.hasClass('fa-play')){
        $btn.removeClass('fa-play').addClass('fa-pause');
        _this.audio.play();
      }else if($btn.hasClass('fa-pause')){
        $btn.removeClass('fa-pause').addClass('fa-play');
        _this.audio.pause();
      }
    });
    //下一首
    _this.$cover.find('.btn-forward').on('click',function(){
      _this.loadMusic();
    });
    //当音乐播放暂停，按钮设置，进度条设置
    _this.audio.addEventListener('play',function(){
      _this.$play_pause.removeClass('fa-play').addClass('fa-pause');
      //防止多重计时，每次设置计时器先取消
      clearInterval(_this.statusClock);
      _this.statusClock = setInterval(function(){
        _this.updateStatus();
      },1000)
    });
    this.audio.addEventListener('pause',function(){
      _this.$play_pause.removeClass('fa-pause').addClass('fa-pause');
      clearInterval(_this.statusClock);
    })
  },
  loadMusic:function(){
    let _this = this;
    $.getJSON('//jirenguapi.applinzi.com/fm/getSong.php',{channel: _this.channelId})
    .done(function(song){
      _this.song = song['song'][0];
      _this.setMusic();
      _this.loadLyric();
    })
  },
  setMusic:function(){
    console.log('set Music...')
    console.log(this.song)
    this.audio.src = this.song.url;
    this.$cover.find('.btn-play').removeClass('fa-play').addClass('fa-pause');
    $('.bg').css({
      background: `url(${this.song.picture}) center/cover`
    });
    this.$cover.find('figure').css({
      background: `url(${this.song.picture}) center/cover`
    });
    this.$info.find('.head>p').text(this.channelName);
    this.$info.find('.head>h2').text(this.song.title);
    this.$info.find('.author').text(this.song.artist);
  },
  updateStatus:function(){
    let _this = this;
    let sec = Math.floor(_this.audio.currentTime%60)<10?`0${Math.floor(_this.audio.currentTime%60)}`:Math.floor(_this.audio.currentTime%60);
    let min = Math.floor(this.audio.currentTime/60)
    _this.$info.find('.cur-time').text(`${min}:${sec}`)
    _this.$info.find('.cur-bar').css({
      width: `${_this.audio.currentTime/_this.audio.duration*100}%`
    })

    //歌词
    let line = _this.lyricObj[`0${min}:${sec}`];
    if(line){
      this.$info.find('.lyric').text(line);
    }
  },
  loadLyric:function(){
    let _this = this;
    $.getJSON('//jirenguapi.applinzi.com/fm/getLyric.php',{sid:_this.song.sid})
    .done(function(ret){
      console.log(ret.lyric)
      let lyric = ret.lyric;
      let lyricObj = {};
      lyric.split('\n').forEach(function(line){
        let times = line.match(/\d{2}:\d{2}/g);
        let str = line.replace(/\[.+?\]/g,'');
        if(Array.isArray(times)){
          times.forEach(function(time){
            lyricObj[time] = str;
          });
        }
        _this.lyricObj = lyricObj;
      })
    })
  }
}


footer.init();
fm.init();




