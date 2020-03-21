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
const { src, dest, watch } = require('gulp')
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
    // .pipe(dest('dist'))
    .pipe(dest('temp')) // 重构
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
    // .pipe(dest('dist'))
    .pipe(dest('temp')) // 重构
}

// html的处理
// html模板引擎有多种，不同的模板引擎使用不同的插件转换

const page = () => {
  return src('src/*.html', { base: 'src' })
    // .pipe() // 配置html转换插件
    // .pipe(dest('dist'))
    .pipe(dest('temp')) // 重构
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
  // return del('dist')
  return del(['dist', 'temp']) // 重构
}

// 构建开发服务器，并热更新
// 1 安装browser-sync
// 2 引入const browserSync = require('browser-sync')
const browserSync = require('browser-sync')
// 3 创建一个开发服务器
const bs = browserSync.create()
// 4 建立一个gulp任务
const serve = () => {
  // 为了实现src下的内容改变，触发重新构建dist，我们要使用gulp的wath方法监听scr的文件变化
  // 1 引入watch {watch} = require('gulp)
  // 2 调用watch监听每一类文件的变化
  watch('src/assets/styles/*.scss', style)
  watch('src/assets/scripts/*.js', script)
  watch('src/*.html', page)
  // 开发阶段不需要编译这些文件
  // watch('src/assets/images/**', image)
  // watch('src/assets/fonts/**', image)
  // watch('src/public/**', extra)
  // 只需要监听这些文件发生变化时热更新即可
  // 监听这些文件的变化，执行bs的reload方法
  watch([
    'src/assets/images/**',
    'src/assets/fonts/**',
    'src/public/**'
  ], bs.reload)
  
  // 初始化开发服务器配置
  bs.init({
    notify: false, // 是否提示browser connected 
    // port: 3001, // 配置启动端口号，默认3000
    open: false, // 是否自动打开浏览器，默认true
    // 配置哪些文件改变后自动更新
    // 由于服务器运行的项目是基于dist的，所以src下的修改并不会导致浏览器内容自动更新
    files: 'dist/**',
    server: {
      // 基础文件夹
      // 可以传入一个数组，依次在对应的文件夹中寻找文件，这样在开发阶段就不需要将images、fonts等打包进dist
      // baseDir: ['dist', 'src', 'public'],
      baseDir: ['temp', 'src', 'public'], // 重构
      // routes中的配置会优先于baseDir的配置
      routes: {
        '/node_modules': 'node_modules' // 如果是没有打包进dist的文件，可以通过这种方式访问到
      }
    }
  })
}

const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins()

// 使用useref处理文件路径转换
const useref = () => {
  // return src('dist/*.html', {base: 'dist'})
  return src('temp/*.html', {base: 'temp'}) // 重构
  // 通过searchPath配置用来查找文件的目录
    // .pipe(plugins.useref({searchPath: ['dist', '.']}))
    .pipe(plugins.useref({searchPath: ['temp', '.']})) // 重构
    // 通过useref编译之后，可能会生成html、js、css三种类型的文件，可以对他们分别进行压缩混淆等操作
    // 压缩html gulp-htmlmin
    // 压缩js   gulp-uglify
    // 压缩css  gulp-clean-css
    // 由于这里是针对不同类型的文件进行操作，需要判断文件类型，使用gulp-if
    // 1 安装 npm i --save-dev gulp-htmlmin gulp-uglify gulp-clean-css gulp-if
    // 2 放入管道
    // 注意：这里可能出现的问题是，src和dest操作的都是dist目录，也就是一边读一边写，可能会出现冲突
    // 解决方法是将dest的目录修改一下： release
    // 对js的处理
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    // 对css的处理，注意这里使用gulp-clean-css时，中划线会变成驼峰写法cleanCSS
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    // 对html的处理
    // 默认情况下htmlmin只会将html标签中的空去去掉
    // 如果要折叠空白行、内联样式、内联js，需要增加参数配置
    // 其他配置根据需要查看htmlmin的配置
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    })))
    // .pipe(dest('dist'))
    // .pipe(dest('release'))
    .pipe(dest('dist')) // 重构
}

// 多任务处理
// html、css、js的处理互不干扰，所以可以使用parallel同时处理
// const compile = parallel(style, script, page, image, font)
// image,font在开发阶段不需要编译，放到build中
const compile = parallel(style, script, page)

// 1 将需要转义的和不需要的区分开
// 2 使用series控制先删除，再编译
// const build = series(clean, parallel(compile, extra))
// 上线时要执行的任务
// const build = series(clean, parallel(compile, image, font, extra))

// compile之后要进行useref，需要串行执行
const build = series(clean, parallel(series(compile, useref), image, font, extra)) // 重构

// 开发阶段，只需要编译html、css、js，并监听文件变化进行热更新
const develop = series(compile, serve)


module.exports = {
  clean,
  style,
  script,
  page,
  image,
  font,
  compile,
  build,
  serve,
  develop,
  useref
}

// 自动加载插件
// 之前我们的插件都是通过安装，引入，传入pipe的方式使用的
// 当插件较多时每一个都这么配置比较麻烦
// 使用gulp-load-plugins可以自动加载对应的插件
// 1 安装npm i --save-dev gulp-load-plugins
// 2 引入
// const loadPlugins = require('gulp-load-plugins')
// const plugins = loadPlugins() // 执行该方法会返回一个对象，该对象中包含所有要使用的插件
// 3 替换原来的插件
// 例如将sass()替换为plugins.sass()即可

// useref文件引用处理
// 如果在开发阶段我们引用了node_modules下面的文件，在打包生产目录时是不会被打包进去的
// 需要使用usefef进行处理
// 1 安装
// 2 在html添加特殊注释
// <!-- build:css assets/styles/vendor.css -->
// <link ref="stylesheet" href="node_modules/bootstrap/dist/bootstrap.css"></link>
// <!-- endbuild -->
// <!-- build:js assets/scripts/vendor.js -->
// <script src="node_modules/bootstrap/dist/js/bootstrap.css"></script>
// <!-- endbuild -->

// 重新规划构建过程
// 由于使用useref对dist修改，为了避免读写冲突而需要一个临时文件夹，需要对编译过程进行调整
// src -> temp -> dist
// 1 clean时增加clean temp文件夹
// 2 将html、css、js的转换结果放入temp（image、font、extra不需要修改）
// 3 serve的baseDir dist改为temp
// 4 useref从temp取文件，放入dist


// 整理要导出的任务
// 1 要导出的：clean，build，develop
// 2 其他的中间过程不需要导出
// 3 可以将导出的任务配置到package.json中以便使用
// "scripts": {
//   "clean": "gulp clean",
//   "build": "gulp build",
//   "develop": "gulp develop"
// }


// 封装自动化构建工作流
// gulp的构建过程完成后，为了可以在多个项目中快速使用
