import * as Common from '@nestjs/common';

export function Controller(prefix: string) {
    return Common.Controller(prefix);
}

export function Get(path?: string) {
    return Common.Get(path);
}

export function Post(path?: string) {
    return Common.Post(path);
}

export function Patch(path?: string) {
    return Common.Patch(path);
}

export function Delete(path?: string) {
    return Common.Delete(path);
}

export function Body() {
    return Common.Body();
}

export function Param(name: string) {
    return Common.Param(name);
}
