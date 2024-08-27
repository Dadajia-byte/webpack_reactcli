import React,{lazy,Suspense} from 'react';
import { Link,Routes,Route } from 'react-router-dom';
// import Home from './pages/Home';
// import About from './pages/About';
const Home = lazy(()=>import(/* webpackChunkName: 'Home' */'./pages/Home'));
const About = lazy(()=>import(/* webpackChunkName: 'About' */'./pages/About'));
import { Button } from 'antd';
function App() {
    return <>
    <Button>按钮</Button>
    <ul>
        <li><Link to="/home">HOME</Link></li>
        <li><Link to="/about">ABOUT</Link></li>
    </ul>
    <Suspense fallback={<div>Loading...</div>}>
        <Routes>
            <Route path='/home' element={<Home></Home>}></Route>
            <Route path='/about' element={<About></About>}></Route>
        </Routes>
    </Suspense>
    </>
}
export default App