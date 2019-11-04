import React, { Component } from 'react'
// import * as SpriteJS from 'spritejs';
import Image from '../../assets/images/app.png'
import { fabric } from 'fabric';
class TheConfiguration extends Component {
    componentDidMount (){
        console.log(fabric)
        const canvas = new fabric.Canvas('containter')
        // const rect = new fabric.Rect({
        //     left: 100,
        //     top: 100,
        //     fill: 'red',
        //     width: 20,
        //     height: 20
        // })
        // let Img = document.getElementById('my_img')
        const oImg = new fabric.Image.fromURL('http://nfs.gongkong.com/Upload/BBSPicture/201711/20171107115533037_min.png', function (Img){
            console.log(Img)
        })
        canvas.add(oImg)
        // console.log(SpriteJS)
        // const imgURL = 'https://s5.ssl.qhres.com/static/ec9f373a383d7664.svg';
        // const paper = new SpriteJS.Scene('#containter', { viewport: [400, 400]})
        // const sprite = new SpriteJS.Sprite(imgURL)
        // sprite.attr({
        //     bgcolor: '#fff',
        //     pos: [0, 0],
        //     size: [400, 400],
        //     borderRadius: '200'
        //   })
        //   paper.layer().appendChild(sprite)
    }
    render () {
        return (
            <div>
                <canvas id="containter" width="400" height="400">
                    <img src={Image} alt="" id="my_img"/>
                </canvas>
            </div>
        )
    }
}
export default TheConfiguration;