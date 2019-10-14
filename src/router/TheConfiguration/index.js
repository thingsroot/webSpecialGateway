import React, { Component } from 'react';
import * as Sprite from 'spritejs';
class TheConfiguration extends Component {
    componentDidMount () {
        const imgUrl = 'https://s5.ssl.qhres.com/static/ec9f373a383d7664.svg'
        const paper = new Sprite.Scene('#container', {
            viewport: [800, 800]
        })
        const sprite = new Sprite.Sprite(imgUrl)
        sprite.attr({
            bgcolor: '#fff',
            pos: [10, 100],
            size: [100, 100],
            borderRadius: '200'
        })
        sprite.on('click', function () {
            console.log('33333')
            console.log(this)
        })
        paper.layer().appendChild(sprite)
    }
    render () {
        console.log(Sprite)
        return (
            <div>
                <div id="container"></div>
                TheConfiguration
            </div>
        )
    }
}
export default TheConfiguration