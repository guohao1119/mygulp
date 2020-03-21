// gulp配置文件

// 此文件会在node环境下执行
// 使用exports导出一个foo函数
// 命令行执行gulp foo 会打印foo
// 但是同时也会报错，因为gulp要执行的任务必须是异步的
// 因此需要传入一个done作为回调函数
// exports.foo = () => {
//   console.log('foo')
// }

exports.foo = done => {
  console.log('foo')
  done() // 标识任务结束
}

// 默认任务
exports.default = done => {
  console.log('default')
  done()
}

// 在gulp4.0版本之前定义任务的方式，虽然仍然兼容，但已经不再推荐
// 1 引入gulp
const gulp = require('gulp')
// 2 通过task定义任务
gulp.task('bar', done => {
  console.log('bar')
  done()
})

// 创建组合任务
// 通过gulp提供的series和parallel方法分别提供串行和并行任务

// 1 引入series和parallel
const {series, parallel} = require('gulp')

// 首先我们定义三个内部任务
const task1 = done => {
  setTimeout(() => {
    console.log('task1')
    done()
  }, 1000)
}
const task2 = done => {
  setTimeout(() => {
    console.log('task2')
    done()
  }, 1000)
}
const task3 = done => {
  setTimeout(() => {
    console.log('task3')
    done()
  }, 1000)
}

exports.tasksA = series(task1, task2, task3)
exports.tasksB = parallel(task1, task2, task3)

// 分别执行gulp tasksA, gulp tasksB查看并行和串行的执行过程

// 异步任务的三种方式
// 如何通知gulp异步任务已完成
// 1 回调
// 2 Promise
// 3 async / await
// 4 stream // 文件流

// 异步回调的报错
exports.callback = done => {
  console.log('callback task')
  done(new Error('callback error')) // 在回调函数中传入错误
}

exports.promise = () => {
  console.log('promise task')
  return Promise.resolve() // 如果是正常执行完成，调用resolve
  // return Promise.reject() // 如果是异常执行完成，调用reject 会结束后续任务的执行
}

// 定义一个函数，里边返回一个promise
const timeout = time => {
  return new Promise(resolve => {
    setTimeout(resolve, time)
  })
}

exports.async = async () => {
  // 调用异步方法
  await timeout(1000)
  console.log('async end')
}

// const fs = require('fs')
exports.stream = done => {
  const readStream = fs.createReadStream('package.json')
  const writeStream = fs.createWriteStream('temp.txt')
  readStream.pipe(writeStream)
  // return readStream // 返回readStream，gulp会根据读取流的状态判断任务是否完成
  // 也可以通过监听end事件完成任务
  readStream.on('end', () => {
    console.log('stream end')
    done()
  })
}

// gulp构建过程核心工作原理
// 原始状况下，我们需要手工将代码copy到在线压缩工具上进行压缩
// 在gulp中，我们借助node的文件读写api实现
// const fs = require('fs')
// const { Transform } = require('stream')

// exports.default = () => {
//   // 文件读取流
//   const readStream = fs.createReadStream('main.css')
//   // 文件写入流
//   const writeStream = fs.createWriteStream('main.min.css')
//   // 文件转换流
//   const transform = new Transform({
//     transform: (chunk, encoding, callback) => {
//       // 转换过程
//       // chunk是Buffer类型的，先转为字符串
//       const input = chunk.toString()
//       // 替换掉字符串中的空格、注释
//       const output = input.replace(/\s+/g, '').replace(/\/\*.+?\*\//g, '')
//       // 将转换后的字符串返回出去
//       callback(null, output)
//     }
//   })
  
//   // 管道
//   readStream
//     .pipe(transform) // 转换
//     .pipe(writeStream) // 写入

//   return readStream
// }

// gulp在node的基础上进行了封装，提供更好用的功能
// 处理过程是一样的：读取  转换  写入
// 从gulp中拿到src和dest两个方法，分别用来读取和写入
// const { src, dest } = require('gulp')

// exports.default = () => {
//   return src('main.css') // 读取main.css
//   // return src('*.css') // 支持使用通配符的方式
//           // .pipe(dest('dist/css/main.css')) // 通过管道传递给dest
//           .pipe(dest('dist/css')) // 通过管道传递给dest，写入到该路径下（如果不指定文件名则用源文件名）
// }

// 中间的转换过程，可以使用插件
// gulp-clean-css
// 1 安装依赖 npm i --save-dev gulp-clean-css
// 2 引入 
// 3 插入到管道中

// const { src, dest } = require('gulp')
// const clearCss = require('gulp-clean-css')
// exports.default = () => {
//   return src('*.css')
//     .pipe(clearCss())
//     .pipe(dest('dist/css'))
// }

// 案例
const { src, dest } = require('gulp')
const sass = require('gulp-sass')

// css的处理
// 转换sass需要使用到gulp-sass
// 1 安装npm i gulp-sass --save-dev
// 2 引入 const sass = require('gulp-sass')
// 3 放入pipe中执行  .pipe(sass())
// 这里需要注意的是：
// 如果是以下划线开头的scss文件，sass转换时不会单独生成一个文件
// 而是将其中的内容合并到引入了该文件的文件中
const style = () => {
  // 这里加入base:'src'用来将src转换到dist时保持对应目录结构
  return src('src/assets/styles/*.scss', {base: 'src'})
    // sass转换后默认情况下结束的大括号}是放在样式最后一个属性的后面
    // 如果想要放在单独一行，在sass传入参数对象{outputStyle: 'expanded'}
    .pipe(sass({outputStyle: 'expanded'})) // 会将.scss转换会.css
    .pipe(dest('dist'))
}

// js的处理
// 转换js需要使用到gulp-babel
// 1 安装 npm i gulp-babel --save-dev
// 2 引入 const babel = require('gulp-babel')
// 3 放入pipe中执行
// 直接这样执行会报错，因为gulp-babel并不会转换js，而是调用babel
// 4 安装@babel/core @babel/preset-env
// 5 配置babel

const babel = require('gulp-babel')

const script = () => {
  return src('src/assets/scripts/*.js', { base: 'src' })
    .pipe(babel({presets: ['@babel/preset-env']}))
    .pipe(dest('dist'))
}

// html的处理
// html模板引擎有多种，不同的模板引擎使用不同的插件转换

const page = () => {
  return src('src/*.html', { base: 'src' })
    // .pipe() // 配置html转换插件
    .pipe(dest('dist'))
}

// 图片和字体文件的处理
// 需要用到gulp-imagemin
// 1 安装 npm i --save-dev gulp-imagemin
// 2 引入

const imagemin = require('gulp-imagemin')

const image = () => {
  return src('src/assets/images/**', {base: 'src'})
    .pipe(imagemin())
    .pipe(dest('dist'))
}
// 字体文件
const font = () => {
  return src('src/assets/fonts/**', {base: 'src'})
    .pipe(imagemin())
    .pipe(dest('dist'))
}

// 其他文件
// 其他不需要转换的文件，直接copy一份到dist目录中
const extra = () => {
  return src('src/public/**', {base: 'public'})
    .pipe(dest('dist'))
}

// 清除文件
// 使用del
// 1 安装npm i --save-dev del
// 2 引入 const del = require('del')
// 3 调用
const del = require('del')

const clean = () => {
  return del('dist')
}

// 多任务处理
// html、css、js的处理互不干扰，所以可以使用parallel同时处理
const compile = parallel(style, script, page, image, font)

// 1 将需要转义的和不需要的区分开
// 2 使用series控制先删除，再编译
const build = series(clean, parallel(compile, extra))

module.exports = {
  style,
  script,
  page,
  image,
  font,
  compile,
  build
}