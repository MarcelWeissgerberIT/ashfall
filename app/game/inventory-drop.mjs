// Empty space inside the modal cancels a drop; the visible area outside means ground.
export function inventoryDropTarget(x,y,bounds,zone,width,height){
 if(!bounds||x<0||y<0||x>=width||y>=height)return null;
 if(x<bounds.left||x>bounds.right||y<bounds.top||y>bounds.bottom)return 'ground';
 return zone||null;
}
