var Vue = (function (exports) {
    'use strict';

    var isArray = Array.isArray;
    var extend = Object.assign;
    /**
     * 判断是否是对象
     */
    var isObject = function (val) { return val && typeof val === 'object'; };
    /**
     * 判断前后值是否相等
    */
    var hasChanged = function (newVal, oldVal) { return !Object.is(newVal, oldVal); };
    function isFunction(val) {
        return typeof val === 'function';
    }
    var EMPTY_OBJ = {};
    var isReactive = function (val) { return !!(val && val["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */]); };
    function isProxy(value) {
        return isReactive(value) || isReadonly(value);
    }
    function isReadonly(value) {
        return !!(value && value["__v_isReadonly" /* ReactiveFlags.IS_READONLY */]);
    }
    var isString = function (val) { return typeof val === 'string'; };
    var onRE = /^on[^a-z]/;
    var isOn = function (key) { return onRE.test(key); };

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    function createDep(effects) {
        var dep = new Set(effects);
        return dep;
    }

    var targetMap = new WeakMap();
    var activeEffect;
    function effect(fn) {
        var _effect = new ReactiveEffect(fn);
        _effect.run();
    }
    var ReactiveEffect = /** @class */ (function () {
        function ReactiveEffect(fn, scheduler) {
            if (scheduler === void 0) { scheduler = null; }
            this.fn = fn;
            this.scheduler = scheduler;
        }
        ReactiveEffect.prototype.run = function () {
            activeEffect = this;
            return this.fn();
        };
        return ReactiveEffect;
    }());
    /**
     * 收集依赖，建立ReactiveEffect和指定对象的指定属性的联系
     */
    function track(target, key) {
        if (!activeEffect)
            return;
        var depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }
        var dep = depsMap.get(key);
        if (!dep) {
            depsMap.set(key, (dep = createDep()));
        }
        trackEffects(dep);
    }
    /**
     * 收集依赖，一对多
     */
    function trackEffects(dep) {
        dep.add(activeEffect);
    }
    /**
    * 触发依赖，其实就是从targetMap取出fn
    */
    function trigger(target, key, value) {
        var depsMap = targetMap.get(target);
        if (!depsMap)
            return;
        var dep = depsMap.get(key);
        if (!dep)
            return;
        triggerEffects(dep);
    }
    function triggerEffects(dep) {
        var e_1, _a, e_2, _b;
        var effects = isArray(dep) ? dep : __spreadArray([], __read(dep), false);
        try {
            for (var effects_1 = __values(effects), effects_1_1 = effects_1.next(); !effects_1_1.done; effects_1_1 = effects_1.next()) {
                var effect_1 = effects_1_1.value;
                if (effect_1.computed) {
                    triggerEffect(effect_1);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (effects_1_1 && !effects_1_1.done && (_a = effects_1.return)) _a.call(effects_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        try {
            for (var effects_2 = __values(effects), effects_2_1 = effects_2.next(); !effects_2_1.done; effects_2_1 = effects_2.next()) {
                var effect_2 = effects_2_1.value;
                if (!effect_2.computed) {
                    triggerEffect(effect_2);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (effects_2_1 && !effects_2_1.done && (_b = effects_2.return)) _b.call(effects_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
    }
    function triggerEffect(effect) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }

    function createGetter() {
        return function get(target, key, receiver) {
            var res = Reflect.get(target, key, receiver);
            track(target, key);
            return res;
        };
    }
    function createSetter() {
        return function set(target, key, value, receiver) {
            var result = Reflect.set(target, key, value, receiver);
            trigger(target, key);
            return result;
        };
    }
    var get = createGetter();
    var set = createSetter();
    var mutableHandlers = {
        get: get,
        set: set
    };

    // 存储，target和proxy的映射关系
    var reactiveMap = new WeakMap();
    function reactive(target) {
        return createReactiveObject(target, mutableHandlers, reactiveMap);
    }
    function createReactiveObject(target, baseHandlers, proxyMap) {
        var existingProxy = proxyMap.get(target);
        if (existingProxy) {
            return existingProxy;
        }
        var proxy = new Proxy(target, baseHandlers);
        proxy["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */] = true;
        proxyMap.set(target, proxy);
        return proxy;
    }
    function toReactive(value) {
        return isObject(value) ? reactive(value) : value;
    }

    /**
     * 判断是否为ref
    */
    function isRef(r) {
        return !!(r && r.__v_isRef === true);
    }
    function ref(value) {
        return createRef(value, false);
    }
    function createRef(rowValue, shallow) {
        if (isRef(rowValue)) {
            return rowValue;
        }
        return new RefImpl(rowValue, shallow);
    }
    var RefImpl = /** @class */ (function () {
        function RefImpl(value, __v_isShallow) {
            this.__v_isShallow = __v_isShallow;
            this.dep = undefined;
            this.__v_isRef = true;
            this._rowValue = value;
            this._value = toReactive(value);
        }
        Object.defineProperty(RefImpl.prototype, "value", {
            get: function () {
                trackRefValue(this);
                return this._value;
            },
            set: function (newVal) {
                if (hasChanged(newVal, this._rowValue)) {
                    this._rowValue = newVal;
                    this._value = toReactive(newVal);
                    triggerRefValue(this);
                }
            },
            enumerable: false,
            configurable: true
        });
        return RefImpl;
    }());
    /**
     * 收集依赖
    */
    function trackRefValue(ref) {
        if (activeEffect) {
            trackEffects(ref.dep || (ref.dep = createDep()));
        }
    }
    /**
     * 触发依赖
    */
    function triggerRefValue(ref, value) {
        if (ref.dep) {
            triggerEffects(ref.dep);
        }
    }

    var ComputedRefImpl = /** @class */ (function () {
        function ComputedRefImpl(getter) {
            var _this = this;
            this.dep = undefined;
            this._dirty = true;
            this.__v_isRef = true;
            this.effect = new ReactiveEffect(getter, function () {
                if (!_this._dirty) {
                    _this._dirty = true;
                    triggerRefValue(_this);
                }
            });
            this.effect.computed = this;
        }
        Object.defineProperty(ComputedRefImpl.prototype, "value", {
            get: function () {
                trackRefValue(this);
                if (this._dirty) {
                    this._dirty = false;
                    this._value = this.effect.run();
                }
                return this._value;
            },
            enumerable: false,
            configurable: true
        });
        return ComputedRefImpl;
    }());
    function computed(getterOrOptions) {
        var getter = undefined;
        var onlyGetter = isFunction(getterOrOptions);
        if (onlyGetter) {
            getter = getterOrOptions;
        }
        var cRef = new ComputedRefImpl(getter);
        return cRef;
    }

    var isFlushPending = false;
    var pendingPreFlushCbs = [];
    var resolvedPromise = Promise.resolve();
    /**
     * 建立任务队列
    */
    function queuePreFlushCb(cb) {
        queueCb(cb, pendingPreFlushCbs);
    }
    function queueCb(cb, pendingFlush) {
        pendingFlush.push(cb);
        queueFlush();
    }
    function queueFlush() {
        if (!isFlushPending) {
            isFlushPending = true;
            // 将任务队列放在微任务中，然后循环遍历出执行
            resolvedPromise.then(flushJobs);
        }
    }
    function flushJobs() {
        isFlushPending = false;
        flushPreFlushCbs();
    }
    function flushPreFlushCbs() {
        if (pendingPreFlushCbs.length) {
            var activePreFlushCbs = __spreadArray([], __read(new Set(pendingPreFlushCbs)), false);
            pendingPreFlushCbs.length = 0;
            for (var i = 0; i < activePreFlushCbs.length; i++) {
                activePreFlushCbs[i]();
            }
        }
    }

    function watch(source, cb, options) {
        doWatch(source, cb, options);
    }
    function doWatch(source, cb, _a) {
        var _b = _a === void 0 ? EMPTY_OBJ : _a, immediate = _b.immediate, deep = _b.deep;
        var getter;
        if (isReactive(source)) {
            getter = function () { return source; };
            deep = true;
        }
        else {
            getter = function () { };
        }
        if (cb && deep) {
            var baseGetter_1 = getter;
            getter = function () { return traverse(baseGetter_1()); };
        }
        var oldValue = {};
        // job执行一次，相当于watch执行一次
        var job = function () {
            if (cb) {
                var newValue = effect.run();
                if (deep || hasChanged(newValue, oldValue)) {
                    cb(newValue, oldValue);
                    oldValue = newValue;
                }
            }
        };
        var scheduler = function () { return queuePreFlushCb(job); };
        var effect = new ReactiveEffect(getter, scheduler);
        if (cb) {
            if (immediate) {
                job();
            }
            else {
                effect.run();
            }
        }
        else {
            effect.run();
        }
    }
    /**
     * watch收集依赖的关键
    */
    function traverse(value) {
        if (!isObject(value)) {
            return value;
        }
        for (var key in value) {
            traverse(value[key]);
        }
        return value;
    }

    // class增强
    function normalizeClass(value) {
        var res = '';
        if (isString(value)) {
            res = value;
        }
        else if (isArray(value)) {
            for (var i = 0; i < value.length; i++) {
                var normalized = normalizeClass(value[i]);
                if (normalized) {
                    res += normalized + ' ';
                }
            }
        }
        else if (isObject(value)) {
            for (var name_1 in value) {
                if (value[name_1]) {
                    res += name_1 + ' ';
                }
            }
        }
        return res.trim();
    }
    // style增强
    function normalizeStyle(value) {
        if (isArray(value)) {
            var res = {};
            for (var i = 0; i < value.length; i++) {
                var item = value[i];
                var normalized = isString(item)
                    ? parseStringStyle(item)
                    : normalizeStyle(item);
                if (normalized) {
                    for (var name_2 in normalized) {
                        res[name_2] = normalized[name_2];
                    }
                }
            }
            return res;
        }
        else if (isString(value)) {
            return value;
        }
        else if (isObject(value)) {
            return value;
        }
    }
    var listDelimiterRE = /;(?![^(]*\))/g;
    var propertyDelimiterRE = /:(.+)/;
    function parseStringStyle(cssText) {
        var ret = {};
        cssText.split(listDelimiterRE).map(function (item) {
            if (item) {
                var tmp = item.split(propertyDelimiterRE);
                tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
            }
        });
        return ret;
    }

    var Text = Symbol('Text');
    var Comment = Symbol('Comment');
    var Fragment = Symbol('Fragment');
    function isVNode(val) {
        return val ? val.__v_isVNode : false;
    }
    // 设置shapeFlag
    function createVNode(type, props, children) {
        if (props) {
            var kclass = props.class, style = props.style;
            // class增强
            if (kclass && !isString(kclass)) {
                props.class = normalizeClass(kclass);
            }
            // style增强
            if (isObject(style)) {
                if (isProxy(style) && !isArray(style)) {
                    style = extend({}, style);
                }
                props.style = normalizeStyle(style);
            }
        }
        var shapeFlag = isString(type)
            ? 1 /* ShapeFlags.ELEMENT */
            : isObject(type)
                ? 4 /* ShapeFlags.STATEFUL_COMPONENT */
                : 0;
        return createBaseVNode(type, props, children, shapeFlag);
    }
    // 创建VNode，并对VNode进行处理
    function createBaseVNode(type, props, children, shapeFlag) {
        var VNode = {
            __v_isVNode: true,
            type: type,
            props: props,
            shapeFlag: shapeFlag,
            key: (props === null || props === void 0 ? void 0 : props.key) || null
        };
        normalizeChildren(VNode, children);
        return VNode;
    }
    // 改变shapeFlags，记录VNode的类型
    function normalizeChildren(VNode, children) {
        var type = 0;
        if (children == null) {
            children = null;
        }
        else if (isArray(children)) {
            type = 16 /* ShapeFlags.ARRAY_CHILDREN */;
        }
        else if (isObject(children)) ;
        else if (isFunction(children)) ;
        else {
            type = 8 /* ShapeFlags.TEXT_CHILDREN */;
            children = String(children);
        }
        VNode.shapeFlag |= type;
        VNode.children = children;
    }
    function isSameVNodeType(n1, n2) {
        return n1.type === n2.type && n1.key === n2.key;
    }
    var normalizeVNode = function (child) {
        if (typeof child === 'object') {
            return cloneIfMounted(child);
        }
        else {
            return createVNode(Text, null, String(child));
        }
    };
    var cloneIfMounted = function (child) {
        return child;
    };

    // 主要做对参数的处理，然后返回VNode
    function h(type, propsOrChildren, children) {
        var l = arguments.length;
        if (l === 2) {
            if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
                if (isVNode(propsOrChildren)) {
                    return createVNode(type, null, [propsOrChildren]);
                }
                return createVNode(type, propsOrChildren);
            }
            else {
                return createVNode(type, null, propsOrChildren);
            }
        }
        else {
            if (l > 3) {
                children = Array.prototype.slice.call(arguments, 2);
            }
            else if (l === 3 && isVNode(children)) {
                children = [children];
            }
            return createVNode(type, propsOrChildren, children);
        }
    }

    // 传入要注册的生命周期钩子是什么
    var onBeforeMount = createHook("bm" /* LifeCycleHooks.BEFORE_Mount */);
    var onMounted = createHook("m" /* LifeCycleHooks.MOUNTED */);
    function createHook(lifecycle) {
        return function (hook, target) {
            injectHook(lifecycle, hook, target);
        };
    }
    function injectHook(type, hook, target) {
        if (target) {
            target[type] = hook;
        }
    }

    var uid = 0;
    function createComponentInstance(vnode) {
        var type = vnode.type;
        var instance = {
            uid: uid++,
            type: type,
            vnode: vnode,
            render: null,
            subTree: null,
            effect: null,
            update: null,
            isMounted: false,
            bc: null,
            c: null,
            bm: null,
            m: null
        };
        return instance;
    }
    function setupComponent(instance) {
        setupStatefulComponent(instance);
    }
    function setupStatefulComponent(instance) {
        var setup = instance.type.setup;
        if (setup) {
            var setupResult = setup();
            handleSetupResult(setupResult, instance);
        }
        else {
            finishComponentSetup(instance);
        }
    }
    function handleSetupResult(setupResult, instance) {
        if (isFunction(setupResult)) {
            instance.render = setupResult;
        }
        finishComponentSetup(instance);
    }
    /**
     * 1.赋值render
     * 2.处理options
    */
    function finishComponentSetup(instance) {
        var Component = instance.type;
        if (!instance.render) {
            instance.render = Component.render;
        }
        applyOptions(instance);
    }
    function applyOptions(instance) {
        // debugger
        var _a = instance.type, dataOptions = _a.data, beforeCreate = _a.beforeCreate, created = _a.created, beforeMount = _a.beforeMount, mounted = _a.mounted;
        // 初始化参数前执行
        if (beforeCreate) {
            callHook(beforeCreate, instance);
        }
        // stateful component的处理
        // 1. 使用proxy包裹
        // 2. 改变vnode中的this指向
        if (dataOptions) {
            var data = dataOptions();
            if (isObject(data)) {
                instance.data = reactive(data);
            }
        }
        // 初始化参数后执行
        if (created) {
            callHook(created, instance);
        }
        function registerLifecycleHook(register, hook) {
            register(hook === null || hook === void 0 ? void 0 : hook.bind(instance.data), instance);
        }
        // 注册其余的生命周期钩子
        registerLifecycleHook(onBeforeMount, beforeMount);
        registerLifecycleHook(onMounted, mounted);
    }
    function callHook(hook, instance) {
        hook.call(instance.data);
    }

    function renderComponentRoot(instance) {
        var render = instance.render, vnode = instance.vnode, data = instance.data;
        var result;
        if (vnode.shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */) {
            result = normalizeVNode(render.call(data));
        }
        return result;
    }

    function createRenderer(options) {
        return baseCreateRenderer(options);
    }
    function baseCreateRenderer(options) {
        var hostInsert = options.insert, hostCreateElement = options.createElement, hostSetElementText = options.setElementText, hostPatchProp = options.patchProp, hostRemove = options.remove, hostCreateText = options.createText, hostCreateComment = options.createComment, hostSetText = options.setText;
        var setupRenderEffect = function (instance, initialVNode, container, anchor) {
            var componentUpdateFn = function () {
                if (!instance.isMounted) {
                    // 组件挂载
                    var bm = instance.bm, m = instance.m;
                    var subTree = instance.subTree = renderComponentRoot(instance);
                    if (bm) {
                        bm();
                    }
                    patch(null, subTree, container, anchor);
                    if (m) {
                        m();
                    }
                    initialVNode.el = subTree.el;
                    instance.isMounted = true;
                }
                else {
                    // 组件更新
                    var next = instance.next, vnode = instance.vnode;
                    if (!next) {
                        next = vnode;
                    }
                    var nextTree = renderComponentRoot(instance);
                    var preTree = instance.subTree;
                    instance.subTree = nextTree;
                    patch(preTree, nextTree, container, anchor);
                    next.el = nextTree.el;
                }
            };
            var effect = instance.effect = new ReactiveEffect(componentUpdateFn, function () { return queuePreFlushCb(update); });
            var update = instance.update = function () { return effect.run(); };
            update();
        };
        var mountComponent = function (initialVNode, container, anchor) {
            // 创建组件实例
            initialVNode.component = createComponentInstance(initialVNode);
            var instance = initialVNode.component;
            // 组件实例上添加render
            setupComponent(instance);
            // 组件实例渲染
            setupRenderEffect(instance, initialVNode, container, anchor);
        };
        // 挂载
        var mountElement = function (vnode, container, anchor) {
            var type = vnode.type, shapeFlag = vnode.shapeFlag, props = vnode.props;
            // 1.创建DOM元素
            var el = vnode.el = hostCreateElement(type);
            // 2.设置DOM的文本
            if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                hostSetElementText(el, vnode.children);
            }
            else if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                mountChildren(vnode.children, el, null);
            }
            // 3.处理props
            if (props) {
                for (var key in props) {
                    hostPatchProp(el, key, null, props[key]);
                }
            }
            // 4.插入
            hostInsert(el, container, anchor);
        };
        var patchElement = function (oldVNode, newVNode) {
            var el = (newVNode.el = oldVNode.el);
            var oldProps = oldVNode.props || EMPTY_OBJ;
            var newProps = newVNode.props || EMPTY_OBJ;
            // 更新children
            patchChildren(oldVNode, newVNode, el, null);
            // 更新props
            patchProps(el, newVNode, oldProps, newProps);
        };
        var mountChildren = function (children, container, anchor) {
            if (isString(children)) {
                children = children.split('');
            }
            for (var i = 0; i < children.length; i++) {
                var child = (children[i] = normalizeVNode(children[i]));
                patch(null, child, container, anchor);
            }
        };
        // diff算法核心
        var patchKeyedChildren = function (oldChildren, newChildren, container, anchor) {
            var i = 0;
            var newChildrenLength = newChildren.length;
            var oldChildrenEnd = oldChildren.length - 1;
            var newChildrenEnd = newChildrenLength - 1;
            // 1.从前往后
            while (i <= oldChildrenEnd && i <= newChildrenEnd) {
                console.log('one', i);
                var oldVNode = oldChildren[i];
                var newVNode = newChildren[i];
                if (isSameVNodeType(oldVNode, newVNode)) {
                    patch(oldVNode, newVNode, container, anchor);
                }
                else {
                    break;
                }
                i++;
            }
            // 2.从后往前
            while (i <= oldChildrenEnd && i <= newChildrenEnd) {
                console.log('two', i);
                var oldVNode = oldChildren[oldChildrenEnd];
                var newVNode = newChildren[newChildrenEnd];
                if (isSameVNodeType(oldVNode, newVNode)) {
                    patch(oldVNode, newVNode, container, anchor);
                }
                else {
                    break;
                }
                oldChildrenEnd--;
                newChildrenEnd--;
            }
            // 3.newChildren比oldChildren多
            if (i > oldChildrenEnd) {
                if (i <= newChildrenEnd) {
                    var nextpos = newChildrenEnd + 1;
                    var anchor_1 = nextpos < newChildrenLength ? normalizeVNode(newChildren[nextpos]).el : null;
                    while (i <= newChildrenEnd) {
                        patch(null, newChildren[i], container, anchor_1);
                        i++;
                    }
                }
            }
            // 4.newChildren比oldChildren少
            if (i > newChildrenEnd) {
                while (i <= oldChildrenEnd) {
                    unmount(oldChildren[i]);
                    i++;
                }
            }
            // 5.乱序
        };
        var patchChildren = function (oldVNode, newVNode, container, anchor) {
            // 获取新旧vnode的children和shapeFlag
            var c1 = oldVNode && oldVNode.children;
            var oldShapeFlag = oldVNode && oldVNode.shapeFlag;
            var c2 = newVNode.children;
            var shapeFlag = newVNode.shapeFlag;
            if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                if (c2 !== c1) {
                    hostSetElementText(container, c2);
                }
            }
            else {
                if (oldShapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                    if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                        // TODO diff
                        patchKeyedChildren(c1, c2, container, anchor);
                    }
                }
                else {
                    if (oldShapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                        hostSetElementText(container, '');
                    }
                }
            }
        };
        var patchProps = function (el, vnode, oldProps, newProps) {
            // 属性的修改和添加
            if (oldProps !== newProps) {
                for (var key in newProps) {
                    var prev = oldProps[key];
                    var next = newProps[key];
                    if (prev !== next) {
                        hostPatchProp(el, key, prev, next);
                    }
                }
            }
            // 清除newProps上没有的旧属性
            if (oldProps !== EMPTY_OBJ) {
                for (var key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        };
        var processElement = function (oldVNode, newVNode, container, anchor) {
            if (oldVNode == null) {
                mountElement(newVNode, container, anchor);
            }
            else {
                // TODO 更新
                patchElement(oldVNode, newVNode);
            }
        };
        // 文本类型VNode的挂载和更新
        var processText = function (oldVNode, newVNode, container, anchor) {
            if (oldVNode == null) {
                // 挂载操作
                hostInsert((newVNode.el = hostCreateText(newVNode.children)), container, anchor);
            }
            else {
                var el = (newVNode.el = oldVNode.el);
                // 更新操作
                if (oldVNode.children !== newVNode.children) {
                    hostSetText(el, newVNode.children);
                }
            }
        };
        // 注释类型VNode的挂载和更新
        var processCommentNode = function (oldVNode, newVNode, container, anchor) {
            if (oldVNode == null) {
                hostInsert(newVNode.el = hostCreateComment(newVNode.children), container, anchor);
            }
            else {
                newVNode.el = oldVNode.el;
            }
        };
        // Fragment的挂载和更新
        var processFragment = function (oldVNode, newVNode, container, anchor) {
            if (oldVNode == null) {
                mountChildren(newVNode.children, container, anchor);
            }
            else {
                patchChildren(oldVNode, newVNode, container, anchor);
            }
        };
        var processComponent = function (oldVNode, newVNode, container, anchor) {
            if (oldVNode == null) {
                mountComponent(newVNode, container, anchor);
            }
        };
        var patch = function (oldVNode, newVNode, container, anchor) {
            if (anchor === void 0) { anchor = null; }
            // debugger
            if (oldVNode === newVNode) {
                return;
            }
            // 不同元素的处理逻辑
            if (oldVNode && !isSameVNodeType(oldVNode, newVNode)) {
                unmount(oldVNode);
                oldVNode = null;
            }
            var type = newVNode.type, shapeFlag = newVNode.shapeFlag;
            switch (type) {
                case Text:
                    processText(oldVNode, newVNode, container, anchor);
                    break;
                case Comment:
                    processCommentNode(oldVNode, newVNode, container, anchor);
                    break;
                case Fragment:
                    processFragment(oldVNode, newVNode, container, anchor);
                    break;
                default:
                    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                        processElement(oldVNode, newVNode, container, anchor);
                    }
                    else if (shapeFlag & 6 /* ShapeFlags.COMPONENT */) {
                        processComponent(oldVNode, newVNode, container, anchor);
                    }
            }
        };
        // 卸载
        var unmount = function (vnode) {
            hostRemove(vnode.el);
        };
        var render = function (vnode, container) {
            if (vnode == null) {
                // TODO卸载
                unmount(container._vnode);
            }
            else {
                patch(container._vnode || null, vnode, container);
            }
            container._vnode = vnode;
        };
        return {
            render: render
        };
    }

    function patchClass(el, value) {
        if (value == null) {
            el.removeAttribute('class');
        }
        else {
            el.className = value;
        }
    }

    function patchDOMProp(el, key, value) {
        try {
            el[key] = value;
        }
        catch (error) {
            console.log(error);
        }
    }

    function patchAttr(el, key, value) {
        if (value === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, value);
        }
    }

    function patchEvent(el, rawName, prevValue, nextValue) {
        var invokers = el._vei || (el._vei = {});
        var existingInvoker = invokers[rawName];
        if (nextValue && existingInvoker) {
            existingInvoker.value = nextValue;
        }
        else {
            var name_1 = parseName(rawName);
            if (nextValue) {
                var invoker = (invokers[rawName] = createInvoker(nextValue));
                el.addEventListener(name_1, invoker);
            }
            if (existingInvoker) {
                el.removeEventListener(name_1, existingInvoker);
                invokers[rawName] = undefined;
            }
        }
    }
    var parseName = function (name) {
        return name.slice(2).toLowerCase();
    };
    var createInvoker = function (value) {
        var invoker = function () {
            invoker.value && invoker.value();
        };
        invoker.value = value;
        return invoker;
    };

    function patchStyle(el, prev, next) {
        var style = el.style;
        var isCssString = isString(next);
        // 修改和新增样式
        if (next && !isCssString) {
            for (var key in next) {
                setStyle(style, key, next[key]);
            }
        }
        // 移除旧style上的样式
        if (prev && !isString(prev)) {
            for (var key in prev) {
                if (next[key] == null) {
                    setStyle(style, key, '');
                }
            }
        }
    }
    function setStyle(style, name, value) {
        style[name] = value;
    }

    function patchProp(el, key, preValue, nextValue) {
        if (key === 'class') {
            patchClass(el, nextValue);
        }
        else if (key === 'style') {
            patchStyle(el, preValue, nextValue);
        }
        else if (isOn(key)) {
            patchEvent(el, key, preValue, nextValue);
        }
        else if (shouldAsProp(el, key)) {
            patchDOMProp(el, key, nextValue);
        }
        else {
            patchAttr(el, key, nextValue);
        }
    }
    var shouldAsProp = function (el, key) {
        if (key === 'form') {
            return false;
        }
        if (key === 'list' && el.tagName === 'input') {
            return false;
        }
        if (key === 'type' && el.tagName === 'textarea') {
            return false;
        }
        return key in el;
    };

    var doc = document;
    var nodeOps = {
        insert: function (child, parent, anchor) {
            parent.insertBefore(child, anchor || null);
        },
        createElement: function (tag) {
            var el = doc.createElement(tag);
            return el;
        },
        setElementText: function (el, text) {
            el.textContent = text;
        },
        remove: function (child) {
            var parent = child.parentNode;
            if (parent) {
                parent.removeChild(child);
            }
        },
        createText: function (value) {
            return doc.createTextNode(value);
        },
        createComment: function (value) {
            return doc.createComment(value);
        },
        setText: function (node, text) {
            node.nodeValue = text;
        }
    };

    var rendererOptions = extend({ patchProp: patchProp }, nodeOps);
    var renderer;
    function ensureRenderer() {
        return renderer || (renderer = createRenderer(rendererOptions));
    }
    var render = function () {
        var _a;
        var arg = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            arg[_i] = arguments[_i];
        }
        (_a = ensureRenderer()).render.apply(_a, __spreadArray([], __read(arg), false));
    };

    exports.Comment = Comment;
    exports.Fragment = Fragment;
    exports.Text = Text;
    exports.computed = computed;
    exports.effect = effect;
    exports.h = h;
    exports.reactive = reactive;
    exports.ref = ref;
    exports.render = render;
    exports.watch = watch;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
