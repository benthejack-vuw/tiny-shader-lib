## Notes

Because IOS doesn't respect premultipliedAlpha:false in the context settings,
you should premultiply your alpha in the last shader in your shaderchain.

gl_FragColor = vec4(out.rgb \* out.a, out.a);
